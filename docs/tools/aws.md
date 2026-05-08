# AWS Tool Configuration

Use AWS MCP servers with least-privilege AWS credentials. Prefer temporary credentials, IAM Identity Center, and role assumption over long-lived access keys.

## Recommended Access Model

- Use AWS IAM Identity Center or role assumption for local development.
- Use read-only permissions first.
- Use separate roles for read, deploy, and admin workflows.
- Avoid root access keys.
- Avoid long-lived IAM user access keys unless there is no better option.

## Setup

1. Configure AWS CLI profiles with SSO or assumed roles.
2. Confirm the profile has only the permissions needed by the MCP server.
3. Configure your MCP client or local AWS MCP server to use the selected profile.
4. Require approval before any write, deploy, delete, or cost-impacting action.

## Common Read-Only Scopes

- CloudWatch logs and metrics.
- ECS/EKS service status.
- Lambda function metadata.
- S3 object metadata.
- Cost Explorer reports.

## Nexus Safety Policy

- Reading AWS status, logs, and cost data is allowed when configured.
- Deployments require explicit approval.
- Resource creation, deletion, scaling, permission changes, and cost-impacting actions require explicit approval.
- Never print AWS secret access keys or session tokens.

## Official Docs

- AWS MCP servers announcement: https://aws.amazon.com/about-aws/whats-new/2025/05/new-model-context-protocol-servers-aws-serverless-containers
- AWS access key guidance: https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html
- IAM admin access key steps: https://docs.aws.amazon.com/IAM/latest/UserGuide/access-keys-admin-managed.html
