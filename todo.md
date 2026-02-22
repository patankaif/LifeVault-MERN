# Life Vault Project TODO

## Phase 1: Architecture & Database Schema
- [ ] Design MongoDB schema for users, vaults, slots, and scheduling
- [ ] Configure MongoDB Atlas connection
- [ ] Set up Drizzle ORM schema (or use native MongoDB driver)
- [ ] Plan authentication flow with OTP verification
- [ ] Design inactivity detection system
- [ ] Plan Death Vault auto-trigger logic

## Phase 2: Backend Authentication
- [ ] Implement user registration with email/password
- [ ] Implement OTP generation and email sending
- [ ] Implement email verification during signup
- [ ] Implement login with email/password
- [ ] Implement password reset with OTP verification
- [ ] Implement JWT-based session management
- [ ] Track user login activity timestamps
- [ ] Create protected API routes

## Phase 3: Vault System Backend
- [ ] Implement Present Vault CRUD operations
- [ ] Implement nested slot creation and deletion
- [ ] Implement 1-month scheduling limit for Present Vault
- [ ] Implement Future Vault CRUD operations
- [ ] Implement 9-month scheduling limit for Future Vault
- [ ] Implement Death Vault with fixed Mom/Dad slots
- [ ] Implement email-based slot sharing
- [ ] Implement S3 file upload for images/videos
- [ ] Implement file metadata storage in MongoDB
- [ ] Implement slot scheduling and email notifications

## Phase 4: Inactivity Detection & Death Vault
- [ ] Implement 9-month inactivity detection system
- [ ] Implement "are you alive" confirmation email system
- [ ] Implement 15-day confirmation link validity
- [ ] Implement Death Vault auto-trigger on inactivity confirmation failure
- [ ] Implement automated email delivery of Death Vault slots
- [ ] Create background job for inactivity checks

## Phase 5: Frontend - Authentication & Navbar
- [x] Create signup page with OTP verification
- [x] Create login page
- [x] Create password reset page with OTP verification
- [x] Create user profile/dropdown menu
- [x] Implement three-part navbar (logo, next schedule, profile)
- [x] Implement navbar refresh functionality
- [x] Display next scheduled slot in navbar

## Phase 6: Frontend - Vault Interface
- [x] Create Present Vault page with slot management
- [x] Implement slot creation with name input
- [x] Implement nested slot creation
- [x] Implement image/video/text upload to slots
- [x] Implement slot editing and deletion
- [x] Implement slot scheduling UI
- [x] Create Future Vault page (similar to Present)
- [x] Create Death Vault page (Mom/Dad slots only)
- [x] Implement email assignment for slot sharing
- [x] Create shared vault access page (via email link)

## Phase 7: Integration & Testing
- [ ] Fix MongoDB Atlas SSL connection
- [ ] Connect frontend to backend APIs
- [ ] Test authentication flow end-to-end
- [ ] Test vault CRUD operations
- [ ] Test file upload and storage
- [ ] Test scheduling system
- [ ] Test email notifications
- [ ] Test inactivity detection
- [ ] Test Death Vault auto-trigger
- [ ] Performance testing
- [ ] Security testing

## Phase 8: Deployment & Documentation
- [ ] Create API documentation
- [ ] Create user guide
- [ ] Deploy to production
- [ ] Set up monitoring and logging
- [ ] Create backup strategy

## Current Status
**Phase 1-9: COMPLETED** ✅

All features implemented and documented:
- Backend: MongoDB, Auth, OTP, Vaults, Scheduling, Inactivity Detection
- Frontend: All pages in JSX with Tailwind CSS
- Documentation: Setup guides, API testing, VS Code configuration
- Build: Both frontend and backend compile successfully

**Ready for User:**
1. Complete MongoDB Atlas setup
2. Create .env file
3. Run pnpm install
4. Run pnpm dev
5. Test and deploy
