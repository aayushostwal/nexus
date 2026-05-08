# Microsoft / Outlook Tool Configuration

Use Microsoft Graph for Outlook mail and calendar access. Prefer OAuth and the minimum Graph permissions required for the workflow.

## Recommended Access Model

- Use delegated OAuth for user-scoped mail and calendar access.
- Use application permissions only for server-side automation that truly needs tenant-wide access.
- Start read-only. Add write permissions only when the workflow needs to send mail, update events, or modify data.

## Setup

1. Open Microsoft Entra admin center.
2. Create an app registration.
3. Record the Application client ID and Directory tenant ID.
4. Add Microsoft Graph permissions for the required workflow.
5. Use certificates or federated credentials for production.
6. Use client secrets only for local testing.
7. Store secrets outside git.

## Common Permissions

- Mail read: `Mail.Read`
- Calendar read: `Calendars.Read`
- User profile read: `User.Read`
- Mail send: `Mail.Send`
- Calendar write: `Calendars.ReadWrite`

## Nexus Safety Policy

- Reading mail/calendar is allowed when configured.
- Sending email requires explicit approval.
- Updating calendar events requires explicit approval.
- Never print access tokens or client secrets in agent responses.

## Official Docs

- Register an app: https://learn.microsoft.com/en-us/graph/auth-register-app-v2
- Add credentials: https://learn.microsoft.com/entra/identity-platform/how-to-add-credentials
- Microsoft identity application model: https://learn.microsoft.com/en-us/entra/identity-platform/application-model
