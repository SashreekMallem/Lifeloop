'use server';
/**
 * @fileOverview Genkit flow and tools for interacting with Gmail API.
 * Includes fetching email summary data like unread count, recent emails, and priority senders.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema for the main flow
const EmailSummaryInputSchema = z.object({
  oauthToken: z.string().describe('The OAuth access token for Gmail API.'),
});
export type EmailSummaryInput = z.infer<typeof EmailSummaryInputSchema>;

// Output Schema for the main flow
const EmailSummarySuccessSchema = z.object({
  status: z.literal("success"),
  unreadCount: z.number().optional().describe("Total number of unread emails."),
  recentEmails: z.array(z.object({
    id: z.string(),
    subject: z.string(),
    sender: z.string(),
    snippet: z.string(),
    receivedAt: z.string().describe("ISO date string"),
    isImportant: z.boolean().optional(),
    labels: z.array(z.string()).optional()
  })).optional().describe("Recent emails from inbox."),
  prioritySenders: z.array(z.object({
    email: z.string(),
    name: z.string().optional(),
    count: z.number().describe("Number of recent emails from this sender")
  })).optional().describe("Most active email senders recently."),
  actionableEmails: z.array(z.object({
    id: z.string(),
    subject: z.string(),
    sender: z.string(),
    actionType: z.string().describe("Type of action needed (meeting, deadline, task, etc.)"),
    snippet: z.string()
  })).optional().describe("Emails that might require action or contain tasks/deadlines.")
});

const EmailSummaryErrorSchema = z.object({
  status: z.literal("error"),
  errorMessage: z.string()
});

const EmailSummaryAuthSchema = z.object({
  status: z.literal("requires_authentication"),
  message: z.string()
});

const EmailSummaryOutputSchema = z.union([
  EmailSummarySuccessSchema,
  EmailSummaryErrorSchema,
  EmailSummaryAuthSchema
]);

export type EmailSummaryOutput = z.infer<typeof EmailSummaryOutputSchema>;

// Helper function to verify OAuth token and scopes
async function verifyTokenScopes(token: string): Promise<{valid: boolean, scopes: string[], error?: string}> {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
    const tokenInfo = await response.json();
    
    if (!response.ok) {
      return { valid: false, scopes: [], error: tokenInfo.error_description || 'Invalid token' };
    }
    
    const scopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
    const hasGmailReadonly = scopes.includes('https://www.googleapis.com/auth/gmail.readonly');
    const hasGmailMetadata = scopes.includes('https://www.googleapis.com/auth/gmail.metadata');
    
    console.log('[verifyTokenScopes] Token scopes:', scopes);
    console.log('[verifyTokenScopes] Has gmail.readonly:', hasGmailReadonly);
    console.log('[verifyTokenScopes] Has gmail.metadata:', hasGmailMetadata);
    
    return { 
      valid: response.ok, 
      scopes,
      error: !hasGmailReadonly ? 'Token missing gmail.readonly scope' : undefined
    };
  } catch (error: any) {
    return { valid: false, scopes: [], error: error.message };
  }
}

// Helper function to get today's timestamp for filtering
function getTodayStartTimestamp(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor(today.getTime() / 1000); // Gmail uses seconds
}

// Tool to get unread email count
const getUnreadEmailCountTool = ai.defineTool(
  {
    name: 'getUnreadEmailCountTool',
    description: 'Fetches the count of unread emails from Gmail API.',
    inputSchema: z.object({ oauthToken: z.string() }),
    outputSchema: z.object({ unreadCount: z.number().optional() }),
  },
  async (input) => {
    console.log("[getUnreadEmailCountTool] Called");
    if (!input.oauthToken) {
      console.warn("[getUnreadEmailCountTool] OAuth token missing.");
      throw new Error("OAuth token required for getUnreadEmailCountTool.");
    }
    
    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1', {
        headers: { 'Authorization': `Bearer ${input.oauthToken}` },
      });

      const responseText = await response.text();
      console.log(`[getUnreadEmailCountTool] API Response Status: ${response.status}`, responseText);

      if (!response.ok) {
        // Check for scope-related errors
        if (response.status === 403) {
          const errorData = JSON.parse(responseText);
          if (errorData.error && errorData.error.message && errorData.error.message.includes('Insufficient Permission')) {
            throw new Error('Gmail access requires gmail.readonly scope. Please re-authenticate with proper permissions.');
          }
        }
        throw new Error(`Gmail API error for unread count (Status ${response.status}): ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      const unreadCount = data.resultSizeEstimate || 0;
      console.log("[getUnreadEmailCountTool] Unread count:", unreadCount);
      
      return { unreadCount };
    } catch (error: any) {
      console.error("[getUnreadEmailCountTool] Error:", error.message);
      throw error;
    }
  }
);

// Tool to get recent emails
const getRecentEmailsTool = ai.defineTool(
  {
    name: 'getRecentEmailsTool',
    description: 'Fetches recent emails from Gmail inbox.',
    inputSchema: z.object({ 
      oauthToken: z.string(),
      maxResults: z.number().optional().default(10)
    }),
    outputSchema: z.object({ 
      emails: z.array(z.object({
        id: z.string(),
        subject: z.string(),
        sender: z.string(),
        snippet: z.string(),
        receivedAt: z.string(),
        isImportant: z.boolean().optional(),
        labels: z.array(z.string()).optional()
      })).optional() 
    }),
  },
  async (input) => {
    console.log("[getRecentEmailsTool] Called");
    if (!input.oauthToken) {
      console.warn("[getRecentEmailsTool] OAuth token missing.");
      throw new Error("OAuth token required for getRecentEmailsTool.");
    }
    
    try {
      // First, get the list of recent message IDs
      const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox&maxResults=${input.maxResults || 10}`, {
        headers: { 'Authorization': `Bearer ${input.oauthToken}` },
      });

      const listResponseText = await listResponse.text();
      console.log(`[getRecentEmailsTool] List API Response Status: ${listResponse.status}`);

      if (!listResponse.ok) {
        // Check for scope-related errors
        if (listResponse.status === 403) {
          try {
            const errorData = JSON.parse(listResponseText);
            if (errorData.error && errorData.error.message && errorData.error.message.includes('Insufficient Permission')) {
              throw new Error('Gmail access requires gmail.readonly scope. Please re-authenticate with proper permissions.');
            }
          } catch (parseError) {
            // If parsing fails, fall through to generic error
          }
        }
        throw new Error(`Gmail API error for message list (Status ${listResponse.status}): ${listResponseText}`);
      }
      
      const listData = JSON.parse(listResponseText);
      if (!listData.messages || listData.messages.length === 0) {
        return { emails: [] };
      }

      // Get detailed info for each message (batch first few for performance)
      const emails = [];
      const messagesToFetch = listData.messages.slice(0, Math.min(5, input.maxResults || 10));
      
      for (const message of messagesToFetch) {
        try {
          const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
            headers: { 'Authorization': `Bearer ${input.oauthToken}` },
          });

          if (messageResponse.ok) {
            const messageData = JSON.parse(await messageResponse.text());
            
            // Extract headers
            const headers = messageData.payload?.headers || [];
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
            const date = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();
            
            // Clean sender name and email
            const senderMatch = from.match(/^(.*?)\s*<(.+?)>$/) || from.match(/^(.+)$/);
            const senderName = senderMatch ? (senderMatch[1] || senderMatch[0]).replace(/"/g, '').trim() : from;
            
            // Convert date to ISO string
            let receivedAt: string;
            try {
              receivedAt = new Date(date).toISOString();
            } catch {
              receivedAt = new Date().toISOString();
            }

            emails.push({
              id: message.id,
              subject: subject.substring(0, 100), // Limit length
              sender: senderName.substring(0, 50), // Limit length
              snippet: messageData.snippet || '',
              receivedAt,
              isImportant: messageData.labelIds?.includes('IMPORTANT'),
              labels: messageData.labelIds || []
            });
          }
        } catch (msgError) {
          console.warn("[getRecentEmailsTool] Error fetching message details:", msgError);
        }
      }
      
      console.log("[getRecentEmailsTool] Fetched emails:", emails.length);
      return { emails };
    } catch (error: any) {
      console.error("[getRecentEmailsTool] Error:", error.message);
      throw error;
    }
  }
);

// Tool to analyze actionable emails
const getActionableEmailsTool = ai.defineTool(
  {
    name: 'getActionableEmailsTool',
    description: 'Identifies emails that might contain tasks, deadlines, or require action.',
    inputSchema: z.object({ 
      oauthToken: z.string(),
      maxResults: z.number().optional().default(20)
    }),
    outputSchema: z.object({ 
      actionableEmails: z.array(z.object({
        id: z.string(),
        subject: z.string(),
        sender: z.string(),
        actionType: z.string(),
        snippet: z.string()
      })).optional() 
    }),
  },
  async (input) => {
    console.log("[getActionableEmailsTool] Called");
    if (!input.oauthToken) {
      console.warn("[getActionableEmailsTool] OAuth token missing.");
      throw new Error("OAuth token required for getActionableEmailsTool.");
    }
    
    try {
      // Search for emails with action-oriented keywords
      const actionQueries = [
        'subject:(deadline OR due OR urgent OR action OR required OR respond OR reply OR RSVP)',
        'subject:(meeting OR schedule OR appointment OR call)',
        'subject:(task OR todo OR assignment OR review)',
        'subject:(confirm OR confirmation OR approve OR approval)'
      ];
      
      const actionableEmails: any[] = [];
      
      for (const query of actionQueries) {
        try {
          const searchResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query + ' in:inbox')}&maxResults=5`, {
            headers: { 'Authorization': `Bearer ${input.oauthToken}` },
          });

          if (searchResponse.ok) {
            const searchData = JSON.parse(await searchResponse.text());
            if (searchData.messages) {
              for (const message of searchData.messages.slice(0, 2)) { // Limit to 2 per category
                try {
                  const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
                    headers: { 'Authorization': `Bearer ${input.oauthToken}` },
                  });

                  if (messageResponse.ok) {
                    const messageData = JSON.parse(await messageResponse.text());
                    const headers = messageData.payload?.headers || [];
                    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
                    const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
                    
                    // Determine action type based on subject
                    let actionType = 'action';
                    if (subject.toLowerCase().includes('deadline') || subject.toLowerCase().includes('due')) {
                      actionType = 'deadline';
                    } else if (subject.toLowerCase().includes('meeting') || subject.toLowerCase().includes('schedule')) {
                      actionType = 'meeting';
                    } else if (subject.toLowerCase().includes('task') || subject.toLowerCase().includes('todo')) {
                      actionType = 'task';
                    } else if (subject.toLowerCase().includes('confirm') || subject.toLowerCase().includes('approve')) {
                      actionType = 'approval';
                    }

                    // Avoid duplicates
                    if (!actionableEmails.find(e => e.id === message.id)) {
                      actionableEmails.push({
                        id: message.id,
                        subject: subject.substring(0, 80),
                        sender: from.replace(/^(.*?)\s*<(.+?)>$/, '$1').replace(/"/g, '').trim().substring(0, 30),
                        actionType,
                        snippet: messageData.snippet?.substring(0, 100) || ''
                      });
                    }
                  }
                } catch (msgError) {
                  console.warn("[getActionableEmailsTool] Error fetching actionable message:", msgError);
                }
              }
            }
          }
        } catch (queryError) {
          console.warn("[getActionableEmailsTool] Error with query:", query, queryError);
        }
      }
      
      console.log("[getActionableEmailsTool] Found actionable emails:", actionableEmails.length);
      return { actionableEmails: actionableEmails.slice(0, 8) }; // Limit total results
    } catch (error: any) {
      console.error("[getActionableEmailsTool] Error:", error.message);
      throw error;
    }
  }
);

// Main email summary flow
export const getEmailSummaryFlow = ai.defineFlow(
  {
    name: 'getEmailSummaryFlow',
    inputSchema: EmailSummaryInputSchema,
    outputSchema: EmailSummaryOutputSchema,
  },
  async (input) => {
    console.log('[getEmailSummaryFlow] Starting email data retrieval');
    
    try {
      // Verify token and scopes first
      const tokenVerification = await verifyTokenScopes(input.oauthToken);
      if (!tokenVerification.valid) {
        return { 
          status: "requires_authentication" as const, 
          message: `Gmail authentication failed: ${tokenVerification.error || 'Invalid token'}` 
        } as const;
      }

      // Run all tools in parallel for better performance
      const [unreadResult, recentResult, actionableResult] = await Promise.allSettled([
        getUnreadEmailCountTool({ oauthToken: input.oauthToken }),
        getRecentEmailsTool({ oauthToken: input.oauthToken, maxResults: 8 }),
        getActionableEmailsTool({ oauthToken: input.oauthToken, maxResults: 15 })
      ]);

      let unreadCount: number | undefined;
      let recentEmails: any[] | undefined;
      let actionableEmails: any[] | undefined;
      let prioritySenders: any[] | undefined;

      const errors: string[] = [];

      // Process unread count
      if (unreadResult.status === 'fulfilled') {
        unreadCount = unreadResult.value.unreadCount;
      } else {
        console.error('[getEmailSummaryFlow] Error fetching unread count:', unreadResult.reason);
        errors.push((unreadResult.reason as Error).message || "Error fetching unread count.");
      }

      // Process recent emails
      if (recentResult.status === 'fulfilled') {
        recentEmails = recentResult.value.emails;
        
        // Calculate priority senders from recent emails
        if (recentEmails && recentEmails.length > 0) {
          const senderCounts: { [key: string]: { email: string; name: string; count: number } } = {};
          
          recentEmails.forEach(email => {
            const senderKey = email.sender.toLowerCase();
            if (!senderCounts[senderKey]) {
              senderCounts[senderKey] = {
                email: senderKey,
                name: email.sender,
                count: 0
              };
            }
            senderCounts[senderKey].count += 1;
          });
          
          prioritySenders = Object.values(senderCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 senders
        }
      } else {
        console.error('[getEmailSummaryFlow] Error fetching recent emails:', recentResult.reason);
        errors.push((recentResult.reason as Error).message || "Error fetching recent emails.");
      }

      // Process actionable emails
      if (actionableResult.status === 'fulfilled') {
        actionableEmails = actionableResult.value.actionableEmails;
      } else {
        console.error('[getEmailSummaryFlow] Error fetching actionable emails:', actionableResult.reason);
        errors.push((actionableResult.reason as Error).message || "Error fetching actionable emails.");
      }

      // Check for authentication errors
      const combinedErrorMessage = errors.join('; ');
      if (combinedErrorMessage.includes("401") || combinedErrorMessage.includes("403") || 
          combinedErrorMessage.toLowerCase().includes("invalid credentials") || 
          combinedErrorMessage.toLowerCase().includes("token has been expired or revoked")) {
        return { 
          status: "requires_authentication" as const, 
          message: "Gmail authentication failed or token expired. Please re-authenticate." 
        } as const;
      }

      // If all failed and it's not an auth error, return error
      if (errors.length === 3 && !(unreadCount !== undefined || recentEmails || actionableEmails)) {
        return { 
          status: "error" as const, 
          errorMessage: `Failed to retrieve email data: ${combinedErrorMessage}` 
        } as const;
      }

      return {
        status: "success" as const,
        unreadCount,
        recentEmails,
        prioritySenders,
        actionableEmails,
      } as const;

    } catch (error: any) {
      console.error('[getEmailSummaryFlow] Unhandled error in flow:', error);
      if (error.message?.includes("401") || error.message?.includes("403") || 
          error.message?.toLowerCase().includes("invalid credentials")) {
        return { 
          status: "requires_authentication" as const, 
          message: "Gmail authentication error. Please re-authenticate." 
        } as const;
      }
      return { 
        status: "error" as const, 
        errorMessage: error.message || "An unexpected error occurred while fetching email data." 
      } as const;
    }
  }
);

// Exported wrapper function
export async function getEmailSummary(input: EmailSummaryInput): Promise<EmailSummaryOutput> {
  return await getEmailSummaryFlow(input);
}
