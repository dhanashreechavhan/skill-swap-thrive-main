# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The SwapLearnThrive team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

To report a security issue, please use the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/MJ-Sec4yoU/swap-learn-thrive/security/advisories/new) tab.

The SwapLearnThrive team will send a response indicating the next steps in handling your report. After the initial reply to your report, the security team will keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

Report security bugs in third-party modules to the person or team maintaining the module.

## Security Features

SwapLearnThrive implements several security measures:

- **Authentication**: JWT-based authentication with secure token handling
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Server-side validation using Joi/Zod schemas
- **Data Sanitization**: Input sanitization to prevent XSS attacks
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Properly configured CORS policies
- **Environment Variables**: Sensitive data stored in environment variables
- **Password Security**: Bcrypt hashing for password storage
- **Security Headers**: Implementation of security headers via middleware

## Best Practices for Contributors

When contributing to SwapLearnThrive, please:

1. **Never commit sensitive data** (API keys, passwords, tokens)
2. **Use environment variables** for configuration
3. **Validate all inputs** on both client and server side
4. **Follow secure coding practices**
5. **Keep dependencies updated**
6. **Use HTTPS** for all external communications
7. **Implement proper error handling** without exposing sensitive information