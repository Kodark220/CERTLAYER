# Authentication and Access Design

## Login Methods

### Wallet login (primary)
- Supported: MetaMask, WalletConnect, Coinbase Wallet, Rainbow
- Flow: connect wallet -> nonce challenge -> signed message verification -> session mint
- Signature is not a transaction (no gas)

### Email login (secondary)
- Email + password + optional/required 2FA
- Intended for non-wallet team members

## User Types

1. Protocol teams
- Access private protocol dashboard

2. Third-party professionals
- Access API portal and premium data

3. Public users
- No auth needed for Reputation Explorer

## Routing Rules Post-Login

- Registered protocol wallet -> protocol dashboard
- API client account -> API portal
- Unknown identity -> guided registration choices

## Roles

- Owner
- Admin
- Finance
- Viewer

## Security Controls

- Nonce + timestamp in signed challenge
- Session expiry and rotation
- Password hashing (bcrypt/argon2id)
- Mandatory 2FA for privileged roles
- Full audit logs for auth and mutations
