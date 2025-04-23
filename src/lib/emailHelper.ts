import nodemailer from 'nodemailer';

export interface EmailTemplate {
    subject: string;
    html: (params: any) => string;
    text: (params: any) => string;
}

const templates: Record<string, EmailTemplate> = {
    judgeInvitation: {
        subject: 'Invitation to Judge at Hackathon',
        html: (params) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3730a3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Hackathon Judge Invitation</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hello ${params.judgeName},</p>
          <p>You have been invited to judge at the <strong>${params.eventName}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold;">Your Judge Access Information:</p>
            <p style="margin: 10px 0;">Access Code: <strong style="font-family: monospace; background-color: #e5e7eb; padding: 2px 5px; border-radius: 3px;">${params.accessCode}</strong></p>
            ${params.assignedRoom ? `<p style="margin: 10px 0;">Assigned Room: <strong>${params.assignedRoom}</strong></p>` : ''}
          </div>
          
          <p>To access the judging interface, please click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.judgeUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Start Judging
            </a>
          </div>
          
          <p>Alternatively, you can copy and paste the following URL into your browser:</p>
          <p style="font-family: monospace; word-break: break-all;">${params.judgeUrl}</p>
          
          <p>Event Schedule:</p>
          <ul>
            <li><strong>Start Time:</strong> ${new Date(params.startTime).toLocaleString()}</li>
            <li><strong>End Time:</strong> ${new Date(params.endTime).toLocaleString()}</li>
          </ul>
          
          <p>Thank you for participating in our hackathon judging!</p>
          
          <p>Best regards,<br>The Hackathon Team</p>
        </div>
        <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>If you believe you received this email in error, please contact the event organizers.</p>
        </div>
      </div>
    `,
        text: (params) => `
Hello ${params.judgeName},

You have been invited to judge at the ${params.eventName}.

Your Judge Access Information:
- Access Code: ${params.accessCode}
${params.assignedRoom ? `- Assigned Room: ${params.assignedRoom}` : ''}

To access the judging interface, please visit:
${params.judgeUrl}

Event Schedule:
- Start Time: ${new Date(params.startTime).toLocaleString()}
- End Time: ${new Date(params.endTime).toLocaleString()}

Thank you for participating in our hackathon judging!

Best regards,
The Hackathon Team
    `
    },

    eventActivation: {
        subject: 'Hackathon Judging Has Started',
        html: (params) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3730a3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Hackathon Judging Started</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hello ${params.judgeName},</p>
          <p>The judging for <strong>${params.eventName}</strong> has now started!</p>
          
          <p>You can access the judging interface using your access code:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold;">Your Judge Access Information:</p>
            <p style="margin: 10px 0;">Access Code: <strong style="font-family: monospace; background-color: #e5e7eb; padding: 2px 5px; border-radius: 3px;">${params.accessCode}</strong></p>
            ${params.assignedRoom ? `<p style="margin: 10px 0;">Assigned Room: <strong>${params.assignedRoom}</strong></p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.judgeUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Start Judging
            </a>
          </div>
          
          <p>Alternatively, you can copy and paste the following URL into your browser:</p>
          <p style="font-family: monospace; word-break: break-all;">${params.judgeUrl}</p>
          
          <p>Event Schedule:</p>
          <ul>
            <li><strong>Start Time:</strong> ${new Date(params.startTime).toLocaleString()}</li>
            <li><strong>End Time:</strong> ${new Date(params.endTime).toLocaleString()}</li>
          </ul>
          
          <p>Thank you for your participation!</p>
          
          <p>Best regards,<br>The Hackathon Team</p>
        </div>
      </div>
    `,
        text: (params) => `
Hello ${params.judgeName},

The judging for ${params.eventName} has now started!

You can access the judging interface using your access code:
- Access Code: ${params.accessCode}
${params.assignedRoom ? `- Assigned Room: ${params.assignedRoom}` : ''}

To access the judging interface, please visit:
${params.judgeUrl}

Event Schedule:
- Start Time: ${new Date(params.startTime).toLocaleString()}
- End Time: ${new Date(params.endTime).toLocaleString()}

Thank you for your participation!

Best regards,
The Hackathon Team
    `
    },

    tableAssignmentNotification: {
        subject: 'Your Hackathon Table Assignment',
        html: (params) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3730a3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Table Assignment Notification</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p>Hello ${params.teamName} Team,</p>
          <p>Your team has been assigned a table for the hackathon:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center;">
            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #4f46e5;">Table ${params.tableNumber}</p>
            ${params.tableMap ? `<p style="margin: 10px 0;"><strong>Location Details:</strong> ${params.tableMap}</p>` : ''}
          </div>
          
          <p>Please set up your project at this table during the designated setup time. Judges will visit you at this location during the demo/judging period.</p>
          
          <p>Event Schedule:</p>
          <ul>
            <li><strong>Setup Time:</strong> ${params.setupTime || 'Refer to event schedule'}</li>
            <li><strong>Demo Period:</strong> ${params.demoTime || 'Refer to event schedule'}</li>
          </ul>
          
          <p>Good luck with your project presentation!</p>
          
          <p>Best regards,<br>The Hackathon Team</p>
        </div>
      </div>
    `,
        text: (params) => `
Hello ${params.teamName} Team,

Your team has been assigned a table for the hackathon:

Table: ${params.tableNumber}
${params.tableMap ? `Location Details: ${params.tableMap}` : ''}

Please set up your project at this table during the designated setup time. Judges will visit you at this location during the demo/judging period.

Event Schedule:
- Setup Time: ${params.setupTime || 'Refer to event schedule'}
- Demo Period: ${params.demoTime || 'Refer to event schedule'}

Good luck with your project presentation!

Best regards,
The Hackathon Team
    `
    }
};

class EmailHelper {
    private transporter: nodemailer.Transporter;
    private defaultFrom: string;
    private baseUrl: string;

    constructor() {
        // Check if environment variables are set
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT ||
            !process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
            !process.env.EMAIL_FROM || !process.env.NEXTAUTH_URL) {
            console.warn('Email configuration not complete. Some emails may not be sent.');
        }

        this.defaultFrom = process.env.EMAIL_FROM || 'hackathon@example.com';
        this.baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        // Create transporter
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    /**
     * Send an email using a template
     */
    async sendEmail(
        to: string,
        templateName: keyof typeof templates,
        params: any,
        options: {
            from?: string;
            cc?: string;
            bcc?: string;
        } = {}
    ): Promise<boolean> {
        try {
            const template = templates[templateName];

            if (!template) {
                throw new Error(`Template ${templateName} not found`);
            }

            // If email configuration is not set, log the email and return
            if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
                console.log('Email would be sent (development mode):', {
                    to,
                    subject: template.subject,
                    template: templateName,
                    params
                });
                return true;
            }

            // Send the actual email
            const result = await this.transporter.sendMail({
                from: options.from || this.defaultFrom,
                to,
                cc: options.cc,
                bcc: options.bcc,
                subject: template.subject,
                text: template.text(params),
                html: template.html(params),
            });

            console.log('Email sent:', result.messageId);
            return true;
        } catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }

    /**
     * Send judge invitation email
     */
    async sendJudgeInvitation(judge: {
        name: string;
        email: string;
        accessCode: string;
        assignedRoom?: string;
    }, event: {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
        type: string;
    }): Promise<boolean> {
        const judgeUrl = `${this.baseUrl}/judge/${judge.accessCode}${event.type === 'pitching' ? '/pitch' : ''}`;

        return this.sendEmail(judge.email, 'judgeInvitation', {
            judgeName: judge.name,
            eventName: event.name,
            accessCode: judge.accessCode,
            assignedRoom: judge.assignedRoom,
            judgeUrl,
            startTime: event.startTime,
            endTime: event.endTime
        });
    }

    /**
     * Send event activation email to all judges
     */
    async sendEventActivation(judge: {
        name: string;
        email: string;
        accessCode: string;
        assignedRoom?: string;
    }, event: {
        _id: string;
        name: string;
        startTime: string;
        endTime: string;
        type: string;
    }): Promise<boolean> {
        const judgeUrl = `${this.baseUrl}/judge/${judge.accessCode}${event.type === 'pitching' ? '/pitch' : ''}`;

        return this.sendEmail(judge.email, 'eventActivation', {
            judgeName: judge.name,
            eventName: event.name,
            accessCode: judge.accessCode,
            assignedRoom: judge.assignedRoom,
            judgeUrl,
            startTime: event.startTime,
            endTime: event.endTime
        });
    }

    /**
     * Send table assignment notification to team
     */
    async sendTableAssignment(team: {
        name: string;
        emails: string[];
        tableNumber: string;
        tableMap?: string;
    }, eventDetails?: {
        setupTime?: string;
        demoTime?: string;
    }): Promise<boolean> {
        return this.sendEmail(team.emails.join(', '), 'tableAssignmentNotification', {
            teamName: team.name,
            tableNumber: team.tableNumber,
            tableMap: team.tableMap,
            setupTime: eventDetails?.setupTime,
            demoTime: eventDetails?.demoTime
        });
    }
}

// Export a singleton instance of the EmailHelper
export const emailHelper = new EmailHelper();