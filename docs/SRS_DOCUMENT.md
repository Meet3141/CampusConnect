# CampusConnect — Software Requirements Specification (SRS) Document

> **Document Version**: 1.0  
> **Date**: April 15, 2026  
> **Project Title**: CampusConnect — Campus Community Management Platform  
> **Team/Author**: CampusConnect Development Team  

---

## Abstract

**CampusConnect** is a full-stack web application designed to address the fragmentation and inefficiency of campus community management in universities. The platform provides a unified digital ecosystem where students, club administrators, editors, and organization-level administrators can manage clubs, events, memberships, real-time communications, volunteer opportunities, and cross-university event discovery — all within a single, role-aware interface.

**Problem Statement**: University campuses lack a cohesive digital platform that integrates club management, event coordination, membership tracking, real-time communication, and volunteer recruitment. Students rely on disparate tools (WhatsApp groups, Google Forms, email chains, Instagram pages) leading to information silos, missed events, and administrative overhead.

**Solution**: CampusConnect delivers an integrated platform with role-based access control supporting four user tiers (member, clubAdmin, editor, orgAdmin), real-time chat via WebSockets, a club and event lifecycle management system, a volunteer hub, cross-university external event aggregation with OCR poster extraction, and a secure cookie-based authentication system with refresh token rotation.

**Technologies Used**: The application is built using **React 19** (frontend), **Express 5 on Node.js** (backend), **MongoDB Atlas via Mongoose 9** (database), **Socket.IO 4** (real-time), **Vite 7** (build tooling), and **TailwindCSS 4** (styling). Authentication uses **JWT access tokens** (15-minute expiry, HttpOnly cookies) paired with **opaque refresh tokens** (30-day TTL, database-stored) implementing full token rotation with reuse detection.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Literature Review](#2-literature-review)
3. [System Analysis](#3-system-analysis)
4. [Technology Stack](#4-technology-stack)
5. [System Design](#5-system-design)
6. [Testing](#6-testing)
7. [Results](#7-results)
8. [Challenges Faced](#8-challenges-faced)
9. [Conclusion and Future Scope](#9-conclusion-and-future-scope)
10. [References](#references)

---

## 1. Introduction

### 1.1 Background of the Project

University campuses are vibrant ecosystems with dozens of student clubs, hundreds of events per semester, and thousands of students seeking engagement opportunities. Despite this activity, most campuses lack a centralized digital platform that handles the complete lifecycle of campus communities — from club creation and membership management to event coordination, real-time communication, and volunteer recruitment.

Currently, campus organizations rely on a patchwork of tools:
- **Social media** (Instagram, Facebook) for event promotion
- **Messaging apps** (WhatsApp, Telegram) for group communication
- **Forms** (Google Forms) for event registration and membership applications
- **Email** for official announcements
- **Spreadsheets** for attendance and member tracking

This fragmentation creates information silos, causes students to miss events, increases administrative burden on club leaders, and makes it impossible for university administrators to have a holistic view of campus activities.

CampusConnect was conceived to solve these challenges by providing a **unified, role-aware platform** that covers the entire campus community management lifecycle within a single web application.

### 1.2 Problem Definition

The core problems addressed by CampusConnect are:

1. **Fragmented Communication**: Students juggle multiple WhatsApp groups, email threads, and social media pages to stay updated on campus activities. There is no single source of truth.

2. **Inefficient Membership Management**: Club administrators manually track membership applications, approvals, and active members using spreadsheets or forms, leading to errors and delays in the approval workflow.

3. **Poor Event Discovery**: Students frequently miss events because announcements are scattered across platforms. There is no centralized event calendar with filtering and RSVP capabilities.

4. **No Cross-University Event Visibility**: Students interested in hackathons, workshops, or competitions at other universities have no standardized way to discover these opportunities.

5. **Volunteer Recruitment Challenges**: Organizing committees struggle to find and manage volunteers for large events. There is no application-based volunteer recruitment system.

6. **Lack of Administrative Oversight**: University administration has no dashboard to monitor club activities, event frequency, membership trends, or overall campus engagement metrics.

7. **Security and Access Control Gaps**: Existing solutions (shared Google Docs, open WhatsApp groups) lack proper role-based access control, allowing unauthorized actions and information leakage.

### 1.3 Motivation for the Project

The motivation for developing CampusConnect stems from several key observations:

- **Digital Transformation in Education**: Universities worldwide are adopting digital tools for academic management (LMS, ERP), but extracurricular and community management remains largely analog or fragmented.

- **Student Engagement Crisis**: Studies indicate that students who are actively engaged in campus communities have higher academic performance and better post-graduation outcomes. A unified platform lowers the barrier to engagement.

- **Administrative Efficiency**: Club administrators spend a disproportionate amount of time on administrative tasks (membership approvals, event coordination, attendance tracking) rather than focusing on club activities.

- **Real-Time Communication Need**: The pandemic era normalized real-time digital communication for communities. Students expect instant messaging, real-time updates, and live collaboration features.

- **Scalability Requirements**: As campuses grow, manual processes for club and event management become unsustainable. A digital platform with proper data structures and APIs can scale to support hundreds of clubs and thousands of events.

### 1.4 Objectives and Scope of the Project

#### Primary Objectives

| # | Objective | Description |
|---|-----------|-------------|
| O1 | **Unified Club Management** | Enable creation, discovery, and lifecycle management of university clubs with membership workflows |
| O2 | **Event Lifecycle Management** | Support the complete event lifecycle from creation, approval (draft/publish workflow), RSVP, to attendance tracking |
| O3 | **Real-Time Communication** | Provide real-time group chat tied to clubs and events using WebSocket technology |
| O4 | **Role-Based Access Control** | Implement a four-tier role system (member, clubAdmin, editor, orgAdmin) with granular permissions |
| O5 | **Cross-University Event Discovery** | Enable submission and moderation of external university events with verification workflow |
| O6 | **Volunteer Ecosystem** | Create a volunteer hub for posting opportunities, application management, and acceptance workflows |
| O7 | **Secure Authentication** | Implement industry-standard authentication with HttpOnly cookies, token rotation, and reuse detection |
| O8 | **Administrative Dashboard** | Provide platform-level statistics and user management for organization administrators |

#### Scope

**In Scope**:
- Web-based responsive application (desktop and mobile browsers)
- User registration, authentication, and profile management
- Club CRUD with membership approval workflow and coordinator roles
- Internal event management with RSVP, attendance, and draft/publish workflows
- External event submission with editor verification
- Real-time chat system with messaging, reactions, and edit/delete capabilities
- Bookmark system for internal and external events
- Volunteer posting and application management
- Club announcements with pinning
- Admin panel with role management and platform statistics
- Input sanitization and rate limiting

**Out of Scope** (for current version):
- Native mobile applications (iOS/Android)
- Push notifications (browser or mobile)
- Direct file/image upload (currently URL-based)
- Actual OCR processing (stub implementation)
- Email-based verification and password reset flows
- Payment processing for paid events
- Calendar integration (Google Calendar, Outlook)
- Multi-language/internationalization support

---

## 2. Literature Review

### 2.1 Research and Existing Solutions in the Domain

Campus community management sits at the intersection of **social networking**, **event management**, and **organizational tools**. Several categories of existing solutions were analyzed during the research phase:

#### 2.1.1 General-Purpose Social Platforms

**Facebook Groups** and **Discord Servers** are widely used by campus communities for communication and event coordination. Facebook provides Events, Groups, and Messenger functionality, while Discord offers real-time chat channels, voice communication, and role-based permissions.

*Limitations*: These platforms are not designed for institutional use. They lack membership approval workflows, event RSVP with capacity limits, attendance tracking, volunteer management, and administrative oversight dashboards. Data ownership and privacy are concerns.

#### 2.1.2 Dedicated Campus Engagement Platforms

**CampusGroups** (campusgroups.com) is a commercial SaaS platform used by over 500 universities for student organization management. It offers club directories, event calendars, membership tracking, and administrative reporting.

**Campuslabs/Anthology Engage** (formerly OrgSync) provides student organization management, event planning, and assessment tools for higher education institutions.

*Limitations*: These are commercial products with significant licensing costs (#30,000-$100,000+ per year for institutions). They are not open-source, have limited customization options, and may not support real-time chat or volunteer management as first-class features.

#### 2.1.3 Event Management Platforms

**Eventbrite** and **Meetup** are popular event discovery and management platforms. They provide event creation, ticketing, RSVP management, and discovery features.

*Limitations*: These platforms are designed for public events, not for institutional/campus-specific use. They lack club management, membership workflows, internal communication, and role-based access control for university hierarchies.

#### 2.1.4 Communication Platforms

**Slack** and **Microsoft Teams** provide team communication with channels, direct messaging, and integrations. Many campus organizations use these for internal communication.

*Limitations*: These tools are communication-first and lack event management, membership workflows, volunteer recruitment, and public event discovery features. They also carry subscription costs at scale.

### 2.2 Comparative Analysis

| Feature | Facebook Groups | Discord | CampusGroups (SaaS) | Eventbrite | Slack/Teams | **CampusConnect** |
|---------|----------------|---------|---------------------|------------|-------------|-------------------|
| Club Management | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Membership Approval Workflow | ✅ (basic) | ❌ | ✅ | ❌ | ❌ | ✅ |
| Coordinator Role System | ❌ | ✅ (roles) | ✅ | ❌ | ✅ | ✅ |
| Event RSVP with Capacity | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Event Draft/Publish Workflow | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Attendance Tracking | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Real-Time Chat | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Message Reactions | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Volunteer Application System | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cross-University Events | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Event Verification/Moderation | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Club Announcements with Pinning | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Admin Statistics Dashboard | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Bookmark System | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Open Source / Self-Hosted | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cost | Free | Free/Paid | $$$$ | Free/Paid | $$$ | **Free** |

### 2.3 How CampusConnect Differs

CampusConnect differentiates itself through the following key innovations:

1. **Unified Platform**: Unlike existing solutions that excel in one area (communication OR event management OR organization management), CampusConnect integrates all three into a single platform with shared data models and user identity.

2. **Hierarchical Role System**: The four-tier role system (member → clubAdmin → editor → orgAdmin) with per-club coordinator roles provides granular access control not found in general-purpose platforms.

3. **Coordinator Workflow**: The coordinator system allows club admins to delegate event creation to trusted members while maintaining approval control through the draft/publish workflow — a feature unique to CampusConnect.

4. **Volunteer Ecosystem**: The standalone volunteer posting system with application, acceptance, and slot management is not available as a first-class feature in any of the analyzed platforms.

5. **Cross-University Discovery with Moderation**: External event submission with editor verification creates a curated feed of inter-university opportunities, combining crowdsourced content with editorial oversight.

6. **Modern Security Architecture**: HttpOnly cookie-based authentication with opaque refresh token rotation and reuse detection exceeds the security posture of most campus platforms.

7. **Open Source and Self-Hostable**: Unlike commercial SaaS solutions, CampusConnect can be self-hosted by universities, ensuring data sovereignty and zero licensing costs.

---

## 3. System Analysis

### 3.1 Functional Requirements

#### 3.1.1 Authentication & Authorization Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-AUTH-01 | User Registration | High | Users can register with name, email, and password. Password must be 8+ characters with uppercase, lowercase, and digit. |
| FR-AUTH-02 | User Login | High | Users can log in with email and password. System issues HttpOnly access cookie (15min) and refresh cookie (30 days). |
| FR-AUTH-03 | Session Verification | High | System verifies user session on application load by reading the HttpOnly cookie. |
| FR-AUTH-04 | Token Refresh | High | System automatically refreshes expired access tokens using the refresh token. Old refresh token is rotated (one-time use). |
| FR-AUTH-05 | Reuse Detection | High | If a used refresh token is presented, all user sessions are invalidated (theft mitigation). |
| FR-AUTH-06 | Logout | High | User can log out; server invalidates refresh token in database and clears cookies. |
| FR-AUTH-07 | Rate Limiting | Medium | Login and registration endpoints are rate-limited to 10 requests per 15 minutes per IP. |
| FR-AUTH-08 | Role Assignment | High | New users are assigned the "member" role. Only orgAdmin can update user roles. |

#### 3.1.2 Club Management Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-CLUB-01 | Create Club | High | Users with clubAdmin or orgAdmin role can create clubs with name, description, category, and optional cover image. |
| FR-CLUB-02 | Browse Clubs | High | Any user (including unauthenticated) can browse clubs with search (by name) and category filters. Paginated results. |
| FR-CLUB-03 | View Club Details | High | Users can view club details including description, category, member count, admin info. |
| FR-CLUB-04 | Edit Club | Medium | Club admin or orgAdmin can update club name, description, category, and cover image. |
| FR-CLUB-05 | Delete Club | Medium | orgAdmin can delete a club; all associated memberships are cascaded. |
| FR-CLUB-06 | Join Club (Request) | High | Authenticated members can submit a join request. System creates a "pending" membership entry. |
| FR-CLUB-07 | Leave Club | Medium | Members can leave a club; membership record is deleted. Member count is synced. |
| FR-CLUB-08 | Approve/Reject Members | High | Club admin or orgAdmin can approve or reject pending membership requests. Approval syncs memberCount. |
| FR-CLUB-09 | View Members | Medium | Authenticated users can view a club's member list (all statuses) with user details populated. |
| FR-CLUB-10 | My Clubs | Medium | Authenticated users can view clubs they own or are approved members of. |
| FR-CLUB-11 | Assign Coordinator | Medium | Club admin can promote an approved member to coordinator role within the club. |
| FR-CLUB-12 | Remove Coordinator | Medium | Club admin can demote a coordinator back to member role. |

#### 3.1.3 Announcement Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-ANN-01 | Create Announcement | Medium | Club admin or coordinator can post announcements with title, body, tag (general/event/reminder/urgent), and pinned status. |
| FR-ANN-02 | View Announcements | Medium | Approved club members can view announcements sorted by pinned status then creation date. |
| FR-ANN-03 | Delete Announcement | Medium | Original author, club admin, or orgAdmin can delete an announcement. |
| FR-ANN-04 | Pin/Unpin Announcement | Low | Club admin or orgAdmin can toggle the pinned status of announcements. |

#### 3.1.4 Event Management Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-EVT-01 | Create Event | High | Club admin, orgAdmin, or approved coordinator can create events. Coordinator-created events start as "draft" status. |
| FR-EVT-02 | Browse Events | High | Any user can browse events with filters (clubId, category, search query, status). Drafts and pending_approval events are hidden from public listing. |
| FR-EVT-03 | View Event Details | High | Users can view event details including club info (populated), attendees count, and volunteer info. |
| FR-EVT-04 | Edit Event | Medium | Event creator, club admin, or orgAdmin can edit event fields. Only admin-level users can change event status directly. |
| FR-EVT-05 | Delete Event | Medium | Event creator or orgAdmin can delete events. |
| FR-EVT-06 | Publish Event | High | Club admin or orgAdmin can publish a draft/pending_approval event (set status to "upcoming"). Coordinators cannot publish. |
| FR-EVT-07 | Submit for Approval | Medium | Coordinators can submit their draft events for admin review by setting status to "pending_approval". |
| FR-EVT-08 | RSVP for Event | High | Authenticated users can RSVP for upcoming events. System checks capacity limits and blocks RSVP on cancelled/completed/past events. |
| FR-EVT-09 | Cancel RSVP | Medium | Users can cancel their event registration. |
| FR-EVT-10 | View Attendees | Medium | Authenticated users can view the attendee list for an event. |
| FR-EVT-11 | Mark Attendance | Medium | Club admin, orgAdmin, or coordinator can mark registered attendees as "attended" in bulk. |
| FR-EVT-12 | Volunteer Application | Medium | Users can apply to volunteer for events with showOnVolunteerHub=true, submitting their skills. |
| FR-EVT-13 | Review Volunteer | Medium | Club admin, orgAdmin, or coordinator can accept/reject volunteer applications. System checks volunteer limit. |
| FR-EVT-14 | Volunteer Feed | Medium | Public endpoint returns upcoming events seeking volunteers (with open slots). |

#### 3.1.5 External Event Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-EXT-01 | Submit External Event | Medium | Authenticated users can submit external university events with title, university name, category, date, and registration link. |
| FR-EXT-02 | Browse External Events | Medium | Users can browse verified external events with category and university filters. Default listing shows only verified events. |
| FR-EXT-03 | View External Event | Medium | Users can view external event details. Unverified events are hidden from non-admin/non-editor users (returns 404). |
| FR-EXT-04 | Edit External Event | Medium | Uploaders can edit their own unverified events. Editors/orgAdmin can edit any. |
| FR-EXT-05 | Verify External Event | Medium | Users with editor or orgAdmin role can verify external events, setting isVerified=true. |
| FR-EXT-06 | OCR Poster Extraction | Low | Users can submit poster image URLs for data extraction. System caches results (TTL: 24 hours). Note: actual OCR is currently a stub. |

#### 3.1.6 Chat & Messaging Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-CHAT-01 | Create Chat Room | Medium | Authenticated users can create chat rooms tied to a club or event (type + referenceId). Idempotent — returns existing if found. |
| FR-CHAT-02 | View My Chats | Medium | Users can list chat rooms they participate in, sorted by last message time. |
| FR-CHAT-03 | Join/Leave Chat | Medium | Users can join or leave chat rooms. |
| FR-CHAT-04 | Send Message | High | Chat participants can send text messages. System updates chat metadata (lastMessage, lastMessageTime). |
| FR-CHAT-05 | Real-Time Delivery | High | Messages are broadcast to all connected chat room members via Socket.IO in real-time. |
| FR-CHAT-06 | Edit Message | Medium | Message senders can edit their own messages. Edit flag and timestamp are recorded. |
| FR-CHAT-07 | Delete Message | Medium | Message senders can soft-delete their messages. Content is replaced with "This message was deleted". |
| FR-CHAT-08 | Message Reactions | Low | Chat participants can toggle emoji reactions on messages. |
| FR-CHAT-09 | Message Pagination | Medium | Messages are paginated (default 50 per page, max 100) sorted by timestamp descending, reversed for display. |

#### 3.1.7 Bookmark Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-BM-01 | Add Bookmark | Medium | Users can bookmark internal or external events. Upsert pattern prevents duplicates. |
| FR-BM-02 | List Bookmarks | Medium | Users can view their bookmarks with hydrated event data (full event objects populated). |
| FR-BM-03 | Remove Bookmark | Medium | Users can remove their own bookmarks by ID. |

#### 3.1.8 User Profile Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-USER-01 | View Profile | Medium | Users can view their own profile with joined clubs populated. |
| FR-USER-02 | Update Profile | Medium | Users can update name (min 2 chars), bio (max 500 chars), phone, interests (max 15, deduplicated), and avatar (12 presets). |
| FR-USER-03 | Public Profile | Medium | Authenticated users can view other users' public profiles (name, bio, roles, interests, profile picture, join date). |
| FR-USER-04 | Update Roles | High | orgAdmin can update any user's roles. Updates trigger session invalidation (all refresh tokens deleted). |

#### 3.1.9 Volunteer Posting Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-VOL-01 | Create Posting | Medium | Users with clubAdmin or orgAdmin role can create volunteer postings with title, description, date, skills, category, and slot limit. |
| FR-VOL-02 | Browse Postings | Medium | Any user can browse open volunteer postings with category filter and search. |
| FR-VOL-03 | Apply to Posting | Medium | Authenticated users can apply to open postings with an optional message. |
| FR-VOL-04 | Withdraw Application | Medium | Applicants can withdraw their applications. |
| FR-VOL-05 | Review Application | Medium | Posting owner or orgAdmin can accept/reject applications. Auto-fills posting when slots are reached. |
| FR-VOL-06 | My Postings | Medium | Users can view postings they created. |
| FR-VOL-07 | My Applications | Medium | Users can view postings they applied to with their application status. |

#### 3.1.10 Admin Module

| ID | Requirement | Priority | Description |
|----|------------|----------|-------------|
| FR-ADM-01 | Admin Panel | Medium | orgAdmin can access a management dashboard for platform-wide operations. |
| FR-ADM-02 | Admin Statistics | Medium | orgAdmin can view platform statistics (user counts, club counts, event metrics). |
| FR-ADM-03 | Verify Events Page | Medium | Editors and orgAdmin can access a moderation queue for unverified external events. |

### 3.2 Non-Functional Requirements

| ID | Requirement | Category | Description |
|----|------------|----------|-------------|
| NFR-01 | **Performance** | Response Time | API responses should return within 500ms for standard CRUD operations under normal load. |
| NFR-02 | **Performance** | Real-Time Latency | Socket.IO message delivery should occur within 200ms for connected clients. |
| NFR-03 | **Security** | Token Security | Access tokens must be stored in HttpOnly, Secure (production) cookies, inaccessible to JavaScript. |
| NFR-04 | **Security** | Password Hashing | Passwords must be hashed using bcrypt with a salt factor of 10 before database storage. |
| NFR-05 | **Security** | Input Sanitization | All user inputs (req.body, req.params) must be sanitized against NoSQL injection attacks. |
| NFR-06 | **Security** | Rate Limiting | Authentication endpoints must be rate-limited to prevent brute-force attacks. |
| NFR-07 | **Security** | CORS | Cross-origin requests must be restricted to an explicit allowed origin with credentials support. |
| NFR-08 | **Scalability** | Pagination | All list endpoints must support pagination to handle growing datasets. |
| NFR-09 | **Scalability** | Database Indexing | All frequently-queried fields must have MongoDB indexes for optimal query performance. |
| NFR-10 | **Reliability** | Error Handling | All async operations must be wrapped in error handlers. A global error handler must catch unhandled errors. |
| NFR-11 | **Reliability** | Data Integrity | Unique constraints must be enforced at the database level (email, club name, membership pairs). |
| NFR-12 | **Usability** | Responsive Design | The UI must be usable on desktop (1920px), tablet (768px), and mobile (375px) viewports. |
| NFR-13 | **Usability** | Loading States | All asynchronous operations must display loading indicators to the user. |
| NFR-14 | **Maintainability** | Modular Architecture | Frontend components must be organized by feature (pages, components, services, context). Backend must follow MVC pattern (routes, controllers, models). |
| NFR-15 | **Maintainability** | ES Modules | Both frontend and backend must use ES Module syntax throughout. |
| NFR-16 | **Availability** | Auto-Cleanup | Expired refresh tokens must be automatically cleaned up via MongoDB TTL indexes. |
| NFR-17 | **Compatibility** | Browser Support | The application must work on the latest versions of Chrome, Firefox, Safari, and Edge. |

---

## 4. Technology Stack

### 4.1 Complete Technology Listing

#### Backend Technologies

| Technology | Version | Layer | Purpose |
|-----------|---------|-------|---------|
| **Node.js** | 20+ (LTS) | Runtime | Server-side JavaScript execution environment |
| **Express** | 5.2.1 | Framework | HTTP server framework with middleware pipeline |
| **Mongoose** | 9.1.5 | ODM | MongoDB object-document mapper with schema validation |
| **MongoDB Atlas** | — | Database | Cloud-hosted NoSQL database (campusDB) |
| **jsonwebtoken** | 9.0.3 | Authentication | JWT creation and verification for access tokens |
| **bcryptjs** | 3.0.3 | Security | Password hashing with salt rounds |
| **Socket.IO** | 4.8.1 | Real-Time | WebSocket server for bidirectional real-time communication |
| **cookie-parser** | 1.4.7 | Middleware | Parse HTTP cookies from request headers |
| **cors** | 2.8.6 | Middleware | Cross-Origin Resource Sharing configuration |
| **express-mongo-sanitize** | 2.2.0 | Security | NoSQL injection prevention |
| **express-rate-limit** | 8.3.2 | Security | Request rate limiting |
| **dotenv** | 17.2.3 | Configuration | Environment variable management |
| **nodemon** | — (dev) | Development | Auto-restart server on file changes |
| **crypto** | Built-in | Security | Cryptographically random refresh token generation |

#### Frontend Technologies

| Technology | Version | Layer | Purpose |
|-----------|---------|-------|---------|
| **React** | 19.2.0 | Framework | Component-based UI library |
| **react-router-dom** | 7.13.0 | Routing | Client-side SPA routing with nested routes |
| **Vite** | 7.2.4 | Build Tool | Fast development server and production bundler |
| **Axios** | 1.13.5 | HTTP Client | Promise-based HTTP client with interceptors |
| **Socket.IO Client** | 4.8.1 | Real-Time | WebSocket client for real-time messaging |
| **TailwindCSS** | 4.2.2 | Styling | Utility-first CSS framework |
| **@vitejs/plugin-react** | 5.1.1 | Build Plugin | React Fast Refresh support |
| **babel-plugin-react-compiler** | 1.0.0 | Compilation | React Compiler for automatic memoization |
| **ESLint** | 9.39.1 | Linting | Code quality and consistency |

### 4.2 Justification for Technology Selection

#### Node.js + Express 5
- **JavaScript Everywhere**: Using JavaScript on both frontend and backend enables code sharing (validation patterns, data shapes) and reduces context-switching for developers.
- **Express 5**: The latest major version provides native async error handling support, improved security defaults, and modern JavaScript compatibility. Express 5's built-in async error forwarding integrates cleanly with our `asyncHandler` + `errorHandler` middleware pattern.
- **Non-blocking I/O**: Node.js's event-driven architecture handles concurrent WebSocket connections and API requests efficiently — critical for a real-time chat system.

#### MongoDB Atlas + Mongoose 9
- **Document Model Fits Domain**: Campus entities (users, clubs, events) have varying structures and embedded relationships (attendees within events, reactions within messages). MongoDB's document model naturally represents these without complex joins.
- **Embedded Subdocuments**: Features like event attendees, volunteer applications, and message reactions are modeled as embedded arrays within their parent documents, providing atomic updates and reducing query complexity.
- **Mongoose 9**: Provides schema validation, middleware hooks (pre-save password hashing), virtual joins via populate, and comprehensive indexing — all essential for data integrity and performance.
- **Atlas Cloud**: Managed hosting eliminates database administration overhead, provides automatic backups, and offers a free tier suitable for development and small deployments.

#### React 19
- **Component Reusability**: The 26-page application benefits from React's component model for shared UI elements (forms, cards, modals, loading indicators).
- **React Compiler**: Version 19's compiler (`babel-plugin-react-compiler`) provides automatic memoization, eliminating the need for manual `useMemo`/`useCallback` optimization.
- **Context API**: The `AuthContext` provides lightweight global state management without external dependency (Redux/Zustand), suitable for the application's moderate state complexity.

#### Vite 7
- **Fast Development**: Vite's native ES Module dev server provides near-instant hot module replacement (HMR), dramatically improving development speed compared to webpack-based alternatives.
- **Optimized Production**: Tree-shaking, code splitting, and minification produce efficient production bundles.

#### Socket.IO 4
- **Fallback Support**: Unlike raw WebSockets, Socket.IO provides automatic fallback to HTTP long-polling, ensuring connectivity even through restrictive firewalls or proxies.
- **Room System**: The built-in room abstraction (`chat:${chatId}`) simplifies targeting messages to specific chat room members.
- **Namespace Support**: Socket.IO's event-based API (`message:new`, `message:updated`, `message:deleted`, `message:reacted`) provides semantic message routing.

#### TailwindCSS 4
- **Rapid Prototyping**: Utility classes enable fast UI development without context-switching between HTML and CSS files.
- **Consistency**: The design token system (colors, spacing, typography) enforces visual consistency across 26 pages.
- **Performance**: PurgeCSS integration removes unused styles, resulting in minimal CSS bundle sizes.

#### HttpOnly Cookies (over localStorage)
- **XSS Protection**: HttpOnly cookies cannot be accessed by JavaScript, eliminating the #1 attack vector for token theft in SPAs.
- **Automatic Transport**: Cookies are automatically sent with every request by the browser — no manual header injection required.

---

## 5. System Design

### 5.1 Use Case Diagram

The system supports four actor roles with hierarchical permissions:

```mermaid
graph TB
    subgraph Actors
        M[👤 Member]
        CA[👤 Club Admin]
        E[👤 Editor]
        OA[👤 Org Admin]
    end

    subgraph "Authentication Use Cases"
        UC1[Register]
        UC2[Login / Logout]
        UC3[Refresh Session]
    end

    subgraph "Club Use Cases"
        UC4[Browse Clubs]
        UC5[View Club Details]
        UC6[Join / Leave Club]
        UC7[Create Club]
        UC8[Edit / Delete Club]
        UC9[Approve / Reject Members]
        UC10[Assign Coordinator]
        UC11[Post Announcement]
    end

    subgraph "Event Use Cases"
        UC12[Browse Events]
        UC13[View Event Details]
        UC14[RSVP / Cancel RSVP]
        UC15[Create Event]
        UC16[Edit / Delete Event]
        UC17[Publish Event]
        UC18[Mark Attendance]
        UC19[Apply as Volunteer]
        UC20[Review Volunteer]
    end

    subgraph "External Event Use Cases"
        UC21[Submit External Event]
        UC22[Browse External Events]
        UC23[Verify External Event]
    end

    subgraph "Chat Use Cases"
        UC24[View My Chats]
        UC25[Join / Leave Chat]
        UC26[Send / Edit / Delete Message]
        UC27[React to Message]
    end

    subgraph "Other Use Cases"
        UC28[Bookmark Events]
        UC29[View / Edit Profile]
        UC30[Browse Volunteer Postings]
        UC31[Apply to Volunteer Posting]
        UC32[Manage User Roles]
        UC33[View Platform Stats]
    end

    M --> UC1 & UC2 & UC3 & UC4 & UC5 & UC6 & UC12 & UC13 & UC14 & UC19 & UC21 & UC22 & UC24 & UC25 & UC26 & UC27 & UC28 & UC29 & UC30 & UC31

    CA --> UC7 & UC8 & UC9 & UC10 & UC11 & UC15 & UC16 & UC17 & UC18 & UC20

    E --> UC23

    OA --> UC7 & UC8 & UC9 & UC10 & UC11 & UC15 & UC16 & UC17 & UC18 & UC20 & UC23 & UC32 & UC33
```

**Role Hierarchy and Permissions**:

| Role | Description | Key Permissions |
|------|------------|-----------------|
| **member** | Default role for all registered users | Browse content, join clubs, RSVP events, use chat, submit external events, bookmark, manage own profile |
| **clubAdmin** | Club administrator (can manage their clubs) | All member permissions + create clubs, create events, approve/reject members, assign coordinators, post announcements |
| **editor** | Content moderator | All member permissions + verify external events |
| **orgAdmin** | Organization-wide super administrator | All permissions + manage user roles (with session invalidation), view platform statistics, delete any club, manage any event |

**Coordinator (Club-Scoped Role)**:

In addition to the four global roles, the system supports a **coordinator** designation per club membership. Coordinators are approved members promoted by the club admin. Their permissions are:
- `event.create` — Create events (status: "draft" — requires admin approval to publish)
- `event.edit` — Edit events they created
- `event.manage_registrations` — Manage event RSVPs
- `event.mark_attendance` — Mark attendees as "attended"
- `announcement.create` — Post club announcements
- `member.view` — View club member lists

Coordinators **cannot**: publish events, assign other coordinators, delete clubs, or manage memberships.

### 5.2 Architecture Diagram

```mermaid
graph TD
    subgraph "Client Layer (Browser)"
        Browser[Web Browser] --> ReactApp[React 19 SPA]
        ReactApp --> Router[React Router v7<br/>26 Routes]
        ReactApp --> AuthCtx[AuthContext<br/>Global Auth State]
        ReactApp --> ApiService[Axios Instance<br/>withCredentials + Auto-Refresh]
        ReactApp --> SocketClient[Socket.IO Client<br/>Real-Time Events]
    end

    subgraph "API Gateway Layer"
        ApiService -->|"HTTP + HttpOnly Cookies"| Express[Express 5 Server]
        SocketClient -->|"WebSocket"| SocketServer[Socket.IO Server]
    end

    subgraph "Middleware Pipeline"
        Express --> CORS[CORS<br/>Origin Whitelist]
        CORS --> CookieParser[Cookie Parser]
        CookieParser --> JSONParser[JSON Body Parser]
        JSONParser --> MongoSanitize[Mongo Sanitize<br/>NoSQL Injection Prevention]
        MongoSanitize --> Routes[Route Handlers]
    end

    subgraph "Route Layer (9 Route Files)"
        Routes --> AuthRoutes["/api/auth<br/>Rate Limited"]
        Routes --> ClubRoutes["/api/clubs"]
        Routes --> EventRoutes["/api/events"]
        Routes --> ChatRoutes["/api/chats"]
        Routes --> MsgRoutes["/api/messages"]
        Routes --> ExtRoutes["/api/external-events"]
        Routes --> BmkRoutes["/api/bookmarks"]
        Routes --> UserRoutes["/api/users"]
        Routes --> VolRoutes["/api/volunteers"]
    end

    subgraph "Middleware Guards"
        AuthRoutes --> RateLimit[Rate Limiter<br/>10 req / 15 min]
        ClubRoutes --> AuthMW[Auth Middleware<br/>JWT Cookie Verify]
        AuthMW --> RoleMW[Role Check<br/>authorize roles]
        RoleMW --> CoordMW[Coordinator Check<br/>Club-Scoped Perms]
    end

    subgraph "Business Logic (10 Controllers)"
        CoordMW --> Controllers[Controllers<br/>asyncHandler wrapped]
    end

    subgraph "Data Layer"
        Controllers --> Mongoose[Mongoose 9 ODM<br/>12 Models]
        Mongoose --> MongoDB[(MongoDB Atlas<br/>campusDB)]
    end

    subgraph "Real-Time Layer"
        SocketServer --> SocketAuth[Socket Auth<br/>Cookie / Bearer / Auth Object]
        SocketAuth --> ChatRooms[Chat Rooms<br/>chat:join / chat:leave]
        Controllers -->|"io.to(room).emit()"| ChatRooms
    end

    subgraph "Error Handling"
        Controllers --> ErrorHandler[Global Error Handler<br/>Mongoose / JWT / Custom Errors]
    end
```

### 5.3 Database Design

#### 5.3.1 Entity-Relationship Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String name
        String email UK
        String password
        Array_String roles
        Array_String interests
        Array_ObjectId joinedClubs
        String profilePicture
        String bio
        String phone
        Boolean isVerified
        Date createdAt
        Date updatedAt
    }

    CLUB {
        ObjectId _id PK
        String name UK
        String description
        String category
        ObjectId adminId FK
        String coverImage
        Number memberCount
        Date createdAt
        Date updatedAt
    }

    MEMBERSHIP {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId clubId FK
        String status
        Date joinedAt
        ObjectId approvedBy FK
        Date approvedAt
        String clubRole
        String coordinatorCategory
        Date createdAt
        Date updatedAt
    }

    EVENT {
        ObjectId _id PK
        String title
        String description
        ObjectId clubId FK
        String category
        Date date
        String venue
        Number maxAttendees
        Boolean showOnVolunteerHub
        Number volunteerLimit
        Array_String volunteerSkillsNeeded
        String image
        String status
        ObjectId createdBy FK
        Date createdAt
        Date updatedAt
    }

    EVENT_ATTENDEE {
        ObjectId userId FK
        String status
        Date registeredAt
    }

    EVENT_VOLUNTEER {
        ObjectId userId FK
        Array_String skills
        String status
        Date appliedAt
        Date reviewedAt
    }

    EXTERNAL_EVENT {
        ObjectId _id PK
        String title
        String description
        String universityName
        String venue
        String category
        Date date
        String registrationLink
        Date registrationDeadline
        ObjectId createdBy FK
        Boolean isVerified
        ObjectId verifiedBy FK
        Date verificationDate
        String image
        Date createdAt
        Date updatedAt
    }

    CHAT {
        ObjectId _id PK
        String type
        ObjectId referenceId FK
        String name
        String description
        Array_ObjectId participants
        String lastMessage
        Date lastMessageTime
        ObjectId lastMessageSenderId FK
        Boolean isActive
        Date createdAt
        Date updatedAt
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId chatId FK
        ObjectId senderId FK
        String message
        String mediaUrl
        String mediaType
        Boolean edited
        Date editedAt
        Boolean deleted
        Date timestamp
    }

    MESSAGE_REACTION {
        ObjectId userId FK
        String emoji
    }

    BOOKMARK {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId eventId FK
        String eventType
        Date createdAt
    }

    OCR_CACHE {
        ObjectId _id PK
        String imageUrl UK
        String imageHash UK
        Object extractedData
        Number confidence
        Number processingTime
        Date createdAt
    }

    REFRESH_TOKEN {
        ObjectId _id PK
        String token UK
        ObjectId userId FK
        Date expiresAt
        Boolean used
        Date createdAt
        Date updatedAt
    }

    ANNOUNCEMENT {
        ObjectId _id PK
        ObjectId clubId FK
        String title
        String body
        ObjectId postedBy FK
        String tag
        Boolean pinned
        Date createdAt
        Date updatedAt
    }

    VOLUNTEER_POSTING {
        ObjectId _id PK
        String title
        String description
        ObjectId postedBy FK
        ObjectId eventId FK
        ObjectId clubId FK
        String venue
        Date date
        String duration
        Array_String skillsNeeded
        String category
        Number slots
        String status
        Date createdAt
        Date updatedAt
    }

    VOLUNTEER_APPLICATION {
        ObjectId userId FK
        String message
        String status
        Date appliedAt
        Date reviewedAt
    }

    USER ||--o{ MEMBERSHIP : "has memberships"
    USER ||--o{ CLUB : "administers"
    USER ||--o{ EVENT : "creates"
    USER ||--o{ BOOKMARK : "saves"
    USER ||--o{ MESSAGE : "sends"
    USER ||--o{ REFRESH_TOKEN : "possesses"
    USER ||--o{ EXTERNAL_EVENT : "submits"
    USER ||--o{ VOLUNTEER_POSTING : "posts"
    USER ||--o{ ANNOUNCEMENT : "authors"

    CLUB ||--o{ MEMBERSHIP : "has members"
    CLUB ||--o{ EVENT : "hosts"
    CLUB ||--o{ CHAT : "has chat (type=club)"
    CLUB ||--o{ ANNOUNCEMENT : "has announcements"
    CLUB ||--o{ VOLUNTEER_POSTING : "linked to"

    EVENT ||--|{ EVENT_ATTENDEE : "has attendees"
    EVENT ||--|{ EVENT_VOLUNTEER : "has volunteers"
    EVENT ||--o{ CHAT : "has chat (type=event)"
    EVENT ||--o{ VOLUNTEER_POSTING : "linked to"

    CHAT ||--o{ MESSAGE : "contains"
    MESSAGE ||--|{ MESSAGE_REACTION : "has reactions"

    VOLUNTEER_POSTING ||--|{ VOLUNTEER_APPLICATION : "has applications"

    EXTERNAL_EVENT ||--o| OCR_CACHE : "extracted from"
```

#### 5.3.2 Database Indexes

Comprehensive indexes are defined at the schema level for all performance-critical queries:

| Model | Index | Type | Purpose |
|-------|-------|------|---------|
| User | `{ createdAt: -1 }` | Sorted | Reverse chronological user listing |
| Club | `{ name: 1 }` | Unique | Prevent duplicate club names |
| Club | `{ adminId: 1 }` | Standard | Admin's clubs lookup |
| Club | `{ category: 1 }` | Standard | Category filtering |
| Club | `{ createdAt: -1 }` | Sorted | Reverse chronological listing |
| Event | `{ clubId: 1 }` | Standard | Club's events lookup |
| Event | `{ date: 1 }` | Sorted | Chronological event listing |
| Event | `{ date: 1, clubId: 1 }` | Compound | Club events sorted by date |
| Event | `{ category: 1 }` | Standard | Category filtering |
| Event | `{ createdBy: 1 }` | Standard | Creator's events lookup |
| Event | `{ "attendees.userId": 1 }` | Subdocument | Attendee lookup |
| Event | `{ showOnVolunteerHub: 1, status: 1 }` | Compound | Volunteer feed query |
| Membership | `{ userId: 1, clubId: 1 }` | Unique | One membership per user-club pair |
| Membership | `{ clubId: 1 }` | Standard | Club members lookup |
| Membership | `{ status: 1 }` | Standard | Status filtering |
| Chat | `{ type: 1, referenceId: 1 }` | Unique | One chat per club/event |
| Chat | `{ participants: 1 }` | Standard | User's chats lookup |
| Chat | `{ lastMessageTime: -1 }` | Sorted | Recent chats first |
| Message | `{ chatId: 1, timestamp: -1 }` | Compound | Paginated chat messages |
| Message | `{ senderId: 1 }` | Standard | User's messages lookup |
| Bookmark | `{ userId: 1, eventId: 1 }` | Unique | No duplicate bookmarks |
| Bookmark | `{ userId: 1, createdAt: -1 }` | Compound | User's bookmarks sorted |
| ExternalEvent | `{ isVerified: 1 }` | Standard | Verified events filtering |
| ExternalEvent | `{ category: 1 }` | Standard | Category filtering |
| ExternalEvent | `{ date: 1 }` | Sorted | Chronological listing |
| OCRCache | `{ imageUrl: 1 }` | Unique | Dedup by URL |
| OCRCache | `{ createdAt: 1 }` | TTL (86400s) | 24-hour auto-cleanup |
| RefreshToken | `{ expiresAt: 1 }` | TTL (0s) | Auto-cleanup after expiry |
| RefreshToken | `{ userId: 1 }` | Standard | User's tokens lookup |
| Announcement | `{ clubId: 1, createdAt: -1 }` | Compound | Club announcements listing |
| VolunteerPosting | `{ status: 1, date: 1 }` | Compound | Open postings listing |
| VolunteerPosting | `{ postedBy: 1 }` | Standard | My postings lookup |
| VolunteerPosting | `{ "applications.userId": 1 }` | Subdocument | My applications lookup |

### 5.4 UI/UX Design

#### 5.4.1 Layout Structure

The application uses a **persistent sidebar + topbar layout** (`AppLayout` component) for all authenticated pages. Unauthenticated pages (Login, Register) use full-screen layouts.

**AppLayout Structure**:
```
┌─────────────────────────────────────────────────┐
│                    Top Bar                       │
│  [Logo/Brand]              [Profile] [Logout]    │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ Sidebar  │          Main Content Area            │
│          │                                       │
│ Dashboard│    (Rendered by <Outlet />)            │
│ Clubs    │                                       │
│ My Clubs │                                       │
│ Events   │                                       │
│ Ext.Evts │                                       │
│ Chats    │                                       │
│ Bookmarks│                                       │
│ Volunteer│                                       │
│ Profile  │                                       │
│          │                                       │
│ [Admin]  │   (role-conditioned visibility)        │
│ [Verify] │                                       │
│ [Stats]  │                                       │
│          │                                       │
└──────────┴──────────────────────────────────────┘
```

#### 5.4.2 Page Count and Size Distribution

| Page | File Size | Complexity | Description |
|------|-----------|-----------|-------------|
| ClubDetail | 51KB | Very High | Club info, member management, coordinator assignment, announcements, events tab |
| Profile | 29KB | High | Profile view/edit, avatar selection, interests management |
| EventDetail | 22KB | High | Event info, RSVP, attendee list, volunteer panel |
| Register | 20KB | Medium | Multi-field form with validation |
| ClubList | 17KB | Medium | Cards grid with search/filter |
| VolunteerHub | 17KB | Medium | Postings list with apply/withdraw, tabs for my-postings |
| Dashboard | 16KB | Medium | Overview cards, recent activity |
| AdminPanel | 16KB | Medium | User management, role updates |
| Login | 16KB | Medium | Auth form with validation |
| UserProfile | 15KB | Medium | Read-only user profile view |
| CreateClub | 15KB | Medium | Form with category selection |
| AdminStats | 14KB | Medium | Statistics display |
| EditEvent | 14KB | Medium | Pre-filled event edit form |
| CreateEvent | 13KB | Medium | Event creation form |
| ChatRoom | 13KB | High | Real-time chat interface |
| EditClub | 13KB | Medium | Pre-filled club edit form |
| VerifyEvents | 12KB | Medium | Moderation queue |
| MyClubs | 12KB | Medium | List of user's clubs |
| CreateExternalEvent | 11KB | Medium | External event submission |
| Events | 10KB | Medium | Event cards with filters |
| ExternalEventDetail | 9KB | Medium | External event info |
| ExternalEvents | 9KB | Medium | External event listing |
| Bookmarks | 8KB | Low | Bookmarked events list |
| ChatList | 6KB | Low | Chat rooms list |
| NotFound | 1.5KB | Low | 404 error page |

### 5.5 Modules/Components Overview

The system is organized into **10 distinct functional modules**:

#### Module 1: Authentication & Session Management
- **Backend**: `authController.js`, `auth.js` (middleware), `RefreshToken.js` (model), `generateToken.js`
- **Frontend**: `AuthContext.jsx`, `api.js` (interceptors), `Login.jsx`, `Register.jsx`
- **Responsibilities**: Registration, login, logout, session verification, automatic token refresh, reuse detection

#### Module 2: Club Management
- **Backend**: `clubController.js`, `Club.js` (model), `Membership.js` (model), `clubs.js` (routes)
- **Frontend**: `ClubList.jsx`, `ClubDetail.jsx`, `CreateClub.jsx`, `EditClub.jsx`, `MyClubs.jsx`
- **Responsibilities**: Club CRUD, membership lifecycle, coordinator management, member count synchronization

#### Module 3: Announcement System
- **Backend**: `announcementController.js`, `Announcement.js` (model), embedded in `clubs.js` routes
- **Frontend**: Integrated within `ClubDetail.jsx`
- **Responsibilities**: Club-scoped announcements with CRUD, pinning, and member-only visibility

#### Module 4: Event Management
- **Backend**: `eventController.js`, `Event.js` (model), `events.js` (routes)
- **Frontend**: `Events.jsx`, `EventDetail.jsx`, `CreateEvent.jsx`, `EditEvent.jsx`
- **Responsibilities**: Event CRUD, draft/publish workflow, RSVP management, attendance tracking, volunteer handling

#### Module 5: External Event Discovery
- **Backend**: `externalEventController.js`, `ExternalEvent.js` (model), `OCRCache.js` (model), `externalEvents.js` (routes)
- **Frontend**: `ExternalEvents.jsx`, `ExternalEventDetail.jsx`, `CreateExternalEvent.jsx`, `VerifyEvents.jsx`
- **Responsibilities**: External event submission, verification workflow, OCR stub, moderation queue

#### Module 6: Chat & Real-Time Messaging
- **Backend**: `chatController.js`, `messageController.js`, `Chat.js` (model), `Message.js` (model), Socket.IO setup in `index.js`
- **Frontend**: `ChatList.jsx`, `ChatRoom.jsx`, `chatApi.js`, `chatSocket.js`
- **Responsibilities**: Chat room lifecycle, message CRUD, real-time delivery, emoji reactions

#### Module 7: Bookmark System
- **Backend**: `bookmarkController.js`, `Bookmark.js` (model), `bookmarks.js` (routes)
- **Frontend**: `Bookmarks.jsx`
- **Responsibilities**: Event bookmarking (internal/external), hydrated listing, removal

#### Module 8: User Profile Management
- **Backend**: `userController.js`, `User.js` (model), `users.js` (routes)
- **Frontend**: `Profile.jsx`, `UserProfile.jsx`
- **Responsibilities**: Own profile CRUD, avatar system (12 presets), public profile viewing

#### Module 9: Volunteer Ecosystem
- **Backend**: `volunteerController.js`, `VolunteerPosting.js` (model), `volunteers.js` (routes)
- **Frontend**: `VolunteerHub.jsx`
- **Responsibilities**: Posting CRUD, application management, acceptance/rejection, auto-fill

#### Module 10: Administration
- **Backend**: `updateRoles` in `userController.js`, various admin-only routes
- **Frontend**: `AdminPanel.jsx`, `AdminStats.jsx`, `AdminRoute.jsx`, `RoleRoute.jsx`
- **Responsibilities**: Role management with session invalidation, platform statistics, route-level guards

### 5.6 Features Developed

#### Tier 1: Core Features (Fully Implemented)

| # | Feature | Backend | Frontend | Real-Time |
|---|---------|---------|----------|-----------|
| 1 | User registration with password validation | ✅ | ✅ | — |
| 2 | Cookie-based login with dual-token system | ✅ | ✅ | — |
| 3 | Automatic token refresh on 401 (interceptor) | ✅ | ✅ | — |
| 4 | Refresh token rotation + reuse detection | ✅ | ✅ | — |
| 5 | Server-side logout with token invalidation | ✅ | ✅ | — |
| 6 | Club CRUD with admin ownership | ✅ | ✅ | — |
| 7 | Club membership: join, leave, approve, reject | ✅ | ✅ | — |
| 8 | Coordinator assignment and removal | ✅ | ✅ | — |
| 9 | Event CRUD with draft/publish workflow | ✅ | ✅ | — |
| 10 | Event RSVP with capacity checks | ✅ | ✅ | — |
| 11 | Event attendance marking (bulk) | ✅ | ✅ | — |
| 12 | Real-time chat with rooms | ✅ | ✅ | ✅ |
| 13 | Message send, edit, soft-delete | ✅ | ✅ | ✅ |
| 14 | Message emoji reactions (toggle) | ✅ | ✅ | ✅ |
| 15 | External event submission + verification | ✅ | ✅ | — |
| 16 | Bookmark internal and external events | ✅ | ✅ | — |
| 17 | User profile with avatar presets | ✅ | ✅ | — |
| 18 | Role management with session invalidation | ✅ | ✅ | — |
| 19 | Club announcements with pinning | ✅ | ✅ | — |
| 20 | Volunteer postings with application workflow | ✅ | ✅ | — |

#### Tier 2: Infrastructure Features

| # | Feature | Details |
|---|---------|---------|
| 1 | Rate limiting | 10 req/15min on auth endpoints |
| 2 | NoSQL injection prevention | `express-mongo-sanitize` on body + params |
| 3 | CORS with credentials | Explicit origin, not wildcard |
| 4 | Global error handling | Mongoose, JWT, and custom errors |
| 5 | Pagination | All list endpoints support page/limit params |
| 6 | Search and filtering | Name/title regex search, category enums |
| 7 | Database indexing | 30+ indexes for performance |
| 8 | Role-based route guards | Frontend: ProtectedRoute, AdminRoute, RoleRoute |
| 9 | Coordinator permission middleware | Club-scoped permission checks |
| 10 | TTL auto-cleanup | RefreshToken (30d) and OCRCache (24h) |

---

## 6. Testing

### 6.1 Types of Testing Performed

#### 6.1.1 Manual API Testing

All 66+ API endpoints were manually tested using **Postman** and **browser developer tools** during development. Testing covered:
- Positive cases (valid inputs, authorized users)
- Negative cases (missing fields, invalid types, unauthorized access)
- Edge cases (duplicate entries, capacity limits, expired tokens)
- Error response format consistency (`{ success: false, message: "..." }`)

#### 6.1.2 Integration Testing

End-to-end flows were tested manually by interacting with the full stack:
- Registration → Login → Session verification → Automatic refresh → Logout
- Club creation → Member join → Admin approval → Coordinator assignment → Event creation as coordinator → Admin publish
- Chat creation → Message sending → Real-time delivery verification → Edit → Delete → Reaction

#### 6.1.3 Security Testing

- **Token theft simulation**: Tested refresh token reuse detection by replaying a used refresh token — confirmed all sessions are invalidated.
- **NoSQL injection**: Tested `{ "$gt": "" }` payloads in login fields — confirmed sanitization prevents injection.
- **Rate limiting**: Verified that 11th login attempt within 15 minutes is blocked with 429 status.
- **Role escalation**: Attempted to pass `roles: ["orgAdmin"]` in registration body — confirmed server ignores it and assigns `["member"]`.
- **Unauthorized access**: Tested accessing admin endpoints without admin role — confirmed 403 responses.

#### 6.1.4 UI/UX Testing

- **Cross-browser**: Tested on Chrome, Firefox, and Edge.
- **Responsive**: Tested on desktop (1920×1080), tablet (768×1024), and mobile (375×667) viewports.
- **Loading states**: Verified all async operations show loading indicators and disable interactive elements.
- **Error display**: Verified API errors are properly displayed to users in the UI.

### 6.2 Testing Tools

| Tool | Purpose |
|------|---------|
| Postman | API endpoint testing with authentication |
| Browser DevTools (Network tab) | HTTP request/response inspection, cookie verification |
| Browser DevTools (Console) | JavaScript error monitoring |
| Browser DevTools (Application tab) | Cookie and localStorage inspection |
| MongoDB Atlas UI | Database state verification after operations |
| Socket.IO Client (browser) | Real-time message delivery verification |

### 6.3 Test Cases and Results

#### 6.3.1 Authentication Test Cases

| # | Test Case | Input | Expected Output | Actual Result | Status |
|---|-----------|-------|----------------|---------------|--------|
| TC-01 | Register with valid credentials | `{ name: "Test", email: "test@email.com", password: "Test1234" }` | 201, user object, cookies set | As expected | ✅ Pass |
| TC-02 | Register with weak password | `{ password: "abc" }` | 400, "Password must be 8+ characters..." | As expected | ✅ Pass |
| TC-03 | Register with duplicate email | Same email as TC-01 | 409, "User already exists" | As expected | ✅ Pass |
| TC-04 | Login with valid credentials | `{ email: "test@email.com", password: "Test1234" }` | 200, user object, cookies set | As expected | ✅ Pass |
| TC-05 | Login with wrong password | `{ email: "test@email.com", password: "wrong" }` | 401, "Invalid credentials" | As expected | ✅ Pass |
| TC-06 | Access protected route without cookie | GET /api/auth/verify (no cookie) | 401, "No token provided" | As expected | ✅ Pass |
| TC-07 | Verify session with valid cookie | GET /api/auth/verify | 200, user object | As expected | ✅ Pass |
| TC-08 | Refresh with valid refresh cookie | POST /api/auth/refresh-token | 200, new cookies set, user object | As expected | ✅ Pass |
| TC-09 | Refresh with used token (reuse) | POST with already-used refresh token | 401, "Refresh token reuse detected" + all sessions invalidated | As expected | ✅ Pass |
| TC-10 | Rate limit exceeded | 11 POST /api/auth/login in 15 min | 429, "Too many attempts..." | As expected | ✅ Pass |

#### 6.3.2 Club Management Test Cases

| # | Test Case | Input | Expected Output | Actual Result | Status |
|---|-----------|-------|----------------|---------------|--------|
| TC-11 | Create club as clubAdmin | `{ name: "Tech Club", description: "...", category: "technical" }` | 201, club object | As expected | ✅ Pass |
| TC-12 | Create club as member (no permission) | Same input, member role | 403, "Insufficient permissions" | As expected | ✅ Pass |
| TC-13 | Create duplicate club name | Same name as TC-11 | 409 (Mongoose duplicate key) | As expected | ✅ Pass |
| TC-14 | Join club as member | POST /api/clubs/:id/join | 200, "Join request submitted" | As expected | ✅ Pass |
| TC-15 | Join own club (admin) | POST /api/clubs/:id/join (as admin) | 400, "Club admins cannot join their own club" | As expected | ✅ Pass |
| TC-16 | Approve member | POST /api/clubs/:id/approve-member | 200, membership approved, memberCount updated | As expected | ✅ Pass |
| TC-17 | Assign coordinator | POST /api/clubs/:id/coordinator/assign | 200, clubRole changed to "coordinator" | As expected | ✅ Pass |

#### 6.3.3 Event Management Test Cases

| # | Test Case | Input | Expected Output | Actual Result | Status |
|---|-----------|-------|----------------|---------------|--------|
| TC-18 | Create event as club admin | Valid event data | 201, status: "upcoming" | As expected | ✅ Pass |
| TC-19 | Create event as coordinator | Valid event data | 201, status: "draft" | As expected | ✅ Pass |
| TC-20 | Publish draft event as admin | POST /api/events/:id/publish | 200, status changed to "upcoming" | As expected | ✅ Pass |
| TC-21 | Publish event as coordinator | POST /api/events/:id/publish | 403, "Only the club admin can publish events" | As expected | ✅ Pass |
| TC-22 | RSVP for event | POST /api/events/:id/rsvp | 200, "Registered for event" | As expected | ✅ Pass |
| TC-23 | RSVP when event is full | Max attendees reached | 400, "Event is full" | As expected | ✅ Pass |
| TC-24 | RSVP for cancelled event | Event status: "cancelled" | 400, "Cannot RSVP: event is cancelled" | As expected | ✅ Pass |
| TC-25 | Mark attendance batch | `{ attendeeIds: [...] }` | 200, count of updated attendees | As expected | ✅ Pass |

#### 6.3.4 Chat & Messaging Test Cases

| # | Test Case | Input | Expected Output | Actual Result | Status |
|---|-----------|-------|----------------|---------------|--------|
| TC-26 | Create chat room | `{ type: "club", referenceId: "...", name: "..." }` | 201, chat object | As expected | ✅ Pass |
| TC-27 | Create duplicate chat room | Same type + referenceId | 200, returns existing (idempotent) | As expected | ✅ Pass |
| TC-28 | Send message | `{ message: "Hello" }` | 201, message with sender populated | As expected | ✅ Pass |
| TC-29 | Real-time delivery | Send message while another user is connected | Other user receives `message:new` event | As expected | ✅ Pass |
| TC-30 | Edit message (own) | PUT /api/messages/:id `{ message: "Edited" }` | 200, edited=true, `message:updated` emitted | As expected | ✅ Pass |
| TC-31 | Edit message (not own) | PUT /api/messages/:id (different sender) | 403, "Forbidden" | As expected | ✅ Pass |
| TC-32 | React to message (toggle) | POST /api/messages/:id/reactions `{ emoji: "👍" }` twice | First: adds reaction. Second: removes reaction | As expected | ✅ Pass |

#### 6.3.5 External Event Test Cases

| # | Test Case | Input | Expected Output | Actual Result | Status |
|---|-----------|-------|----------------|---------------|--------|
| TC-33 | Submit external event | Valid external event data | 201, isVerified: false | As expected | ✅ Pass |
| TC-34 | Browse (default — verified only) | GET /api/external-events | Only verified events returned | As expected | ✅ Pass |
| TC-35 | View unverified event as member | GET /api/external-events/:id | 404 (not 403 — prevents info leak) | As expected | ✅ Pass |
| TC-36 | Verify event as editor | PATCH /api/external-events/:id/verify | 200, isVerified: true | As expected | ✅ Pass |

---

## 7. Results

### 7.1 Functionality Achieved

The CampusConnect application successfully implements the following end-to-end functionalities:

#### 7.1.1 Authentication Flow
The application implements a production-grade authentication system. Upon registration or login, the server issues a short-lived JWT access token (15 minutes) and a long-lived opaque refresh token (30 days), both stored as HttpOnly cookies. The Axios interceptor automatically detects 401 responses, silently refreshes the access token using the refresh cookie, and retries the original request — providing seamless session continuity. Refresh token rotation means each refresh token can only be used once; if a used token is replayed, all of the user's active sessions are terminated.

#### 7.1.2 Club Lifecycle Management
Clubs can be created by authorized admins with full CRUD operations. The membership system supports a complete workflow: members submit join requests → club admins approve/reject → approved members can be promoted to coordinators. The coordinator system introduces a delegation layer where trusted members gain specific permissions (event creation, announcements) without having full admin access.

#### 7.1.3 Event Workflow Engine
Events follow a multi-stage lifecycle: `draft` → `pending_approval` → `upcoming` → `ongoing` → `completed`/`cancelled`. Coordinators create events in "draft" status, submit them for approval, and club admins publish them. This ensures quality control while enabling distributed event creation. The RSVP system enforces capacity limits, prevents registration for past/cancelled events, and supports bulk attendance marking.

#### 7.1.4 Real-Time Chat
The chat system provides WebSocket-based real-time messaging with room isolation. Each chat room is tied to a club or event. Messages support editing, soft-deletion, and emoji reactions — all broadcast in real-time to connected participants via Socket.IO room events.

#### 7.1.5 Volunteer Ecosystem
Two complementary volunteer systems exist: (1) Event-level volunteering — embedded within the Event model with application/acceptance, and (2) Standalone volunteer postings — via the `VolunteerPosting` model for opportunities not tied to specific events. Both support slot limits with automatic status updates.

#### 7.1.6 Cross-University Event Discovery
External events go through a moderation pipeline: users submit events → editors/admins verify → verified events appear in public listings. Unverified events are hidden from regular users (returning 404 instead of 403 to prevent information leakage).

### 7.2 Application Screenshots

> **Note**: The following sections describe the key screens of the application. Screenshots should be captured from the running application at `http://localhost:5173`.

**Login Page**: Dark-themed authentication page with email/password fields, client-side validation (email format, password strength indicators), error message display, and a link to the registration page.

**Registration Page**: Multi-field registration form with name, email, and password fields. Real-time password validation showing requirements (uppercase, lowercase, digit, 8+ characters).

**Dashboard**: Post-login landing page showing the user's overview — clubs joined, upcoming events, recent announcements, and quick-action cards for common operations.

**Club List**: Grid/card layout showing all clubs with search bar, category filter, member count badges, and "Join" buttons. Paginated results.

**Club Detail**: Rich detail page with tabs for: Overview (description, admin, member count), Members (with approve/reject for admins), Coordinators (assignment panel), Announcements (with create/pin for admins), and Events (club's event listing).

**Events Page**: Card-based event listing with date-sorted display, category badges, RSVP counters, and filter controls.

**Event Detail**: Full event page with description, date/venue, RSVP button with capacity indicator, attendee list, volunteer panel (if enabled), and admin controls (publish, mark attendance).

**Chat Room**: Real-time messaging interface with message bubbles (differentiated sender/receiver), timestamps, edit/delete actions on own messages, emoji reaction bar, and a message input area.

**Profile Page**: User profile view/edit with avatar selection grid (12 presets), name/bio/phone fields, interests tag input, and role badges.

**Admin Panel**: Organization-level management panel with user listing, role update capabilities, and platform-wide statistics.

### 7.3 Performance Benchmarks

| Metric | Measured Value | Target |
|--------|---------------|--------|
| API Response Time (CRUD operations) | < 100ms (local dev) | < 500ms |
| Token Refresh Cycle | < 200ms (transparent to user) | < 500ms |
| Socket.IO Message Delivery | < 50ms (local) | < 200ms |
| Initial Page Load (Vite dev server) | < 500ms | < 2s |
| Production Bundle Size (estimated) | ~350KB JSX | < 1MB |
| MongoDB Query Time (indexed) | < 20ms | < 100ms |
| Concurrent WebSocket Connections | Tested up to 50 | 100+ |

---

## 8. Challenges Faced

### 8.1 Express 5 Compatibility

**Challenge**: Express 5 introduced breaking changes, notably making `req.query` a read-only getter. The `express-mongo-sanitize` middleware attempted to reassign `req.query`, causing runtime errors.

**Solution**: Implemented a custom middleware wrapper that manually sanitizes only `req.body` and `req.params` (which remain writable in Express 5), bypassing the automatic `app.use(mongoSanitize())` pattern:
```javascript
app.use((req, res, next) => {
  if (req.body)   req.body   = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});
```

### 8.2 Cookie-Based Authentication Migration

**Challenge**: The original design used `localStorage` for token storage with an Axios request interceptor for header injection. This approach is vulnerable to XSS attacks. Migrating to HttpOnly cookies required changes across the entire authentication pipeline.

**Solution**: 
- Server: Switched from returning tokens in response body to setting HttpOnly cookies via `res.cookie()`.
- Client: Configured Axios with `withCredentials: true` for automatic cookie transport.
- Client: Replaced `localStorage` token management with a response interceptor that automatically refreshes on 401.
- Token refresh: Changed from JWT-based refresh (decoding expired JWT) to opaque token stored in MongoDB with TTL.

### 8.3 Club.members vs Membership Model Duplication

**Challenge**: The original design embedded a `members[]` array directly within the Club schema AND had a separate Membership model, creating data duplication and synchronization issues.

**Solution**: Removed the embedded `members[]` array from the Club schema entirely. Added migration scripts (`scripts/migrate-members.js`, `scripts/drop-members-field.js`) to move existing data to the Membership collection. The Club model now has only a denormalized `memberCount` field, synced via `Membership.countDocuments()` after each approve/reject/leave operation.

### 8.4 Coordinator Draft/Publish Workflow

**Challenge**: Allowing coordinators to create events while maintaining admin approval control required a multi-status workflow that didn't exist in the original event model.

**Solution**: Extended the event `status` enum to include `draft` and `pending_approval` states. The `createEvent` controller assigns "draft" status when the creator is a coordinator and "upcoming" when created by an admin. A separate `publishEvent` endpoint (admin-only) transitions events from draft/pending to upcoming. Public event listings filter out non-published statuses.

### 8.5 Refresh Token Reuse Detection

**Challenge**: If an attacker steals a refresh token, they could use it indefinitely. Standard refresh token rotation alone doesn't prevent concurrent use of stolen tokens.

**Solution**: Implemented a `used` flag on the RefreshToken model. When a refresh token is consumed, it's marked as `used = true` and a new one is issued. If a `used` token is ever presented again, this indicates potential theft — the system deletes ALL refresh tokens for that user, forcing re-authentication across all their devices.

### 8.6 Real-Time Message Delivery Architecture

**Challenge**: Integrating Socket.IO with Express required careful setup to share the same HTTP server, authenticate WebSocket connections using the same token system, and broadcast messages from REST controllers to connected Socket.IO clients.

**Solution**: 
- Created the server with `http.createServer(app)` to share the port between Express and Socket.IO.
- Stored the `io` instance on the Express app (`app.set("io", io)`) so controllers can access it via `req.app.get("io")`.
- Socket.IO middleware extracts JWT from cookies, Bearer headers, or the handshake auth object.
- Message controller calls `io.to('chat:${chatId}').emit(eventName, payload)` after database writes.

### 8.7 OptionalAuth for Public Routes with Role-Aware Responses

**Challenge**: Some endpoints (external event detail) need to be publicly accessible but should show different data based on the user's role (editors can see unverified events).

**Solution**: Created an `optionalAuth` middleware that attempts JWT verification but passes through on failure instead of returning 401. Controllers check `req.user?.roles` for role-aware response filtering.

### 8.8 Large Page Components

**Challenge**: Several pages (ClubDetail at 51KB, Profile at 29KB) grew very large due to inline styling, complex state management, and multiple sub-features (tabs, modals, forms) within a single component.

**Solution**: While functional, these large components represent technical debt. The TailwindCSS migration helped reduce inline style boilerplate. Future refactoring should extract sub-components (MemberList, AnnouncementPanel, EventTab) from monolithic page files.

---

## 9. Conclusion and Future Scope

### 9.1 Summary of Project Achievements

CampusConnect has been successfully developed as a comprehensive campus community management platform that significantly exceeds its original specification. Key achievements include:

1. **Complete Feature Coverage**: From the initial specification of "only authentication wired", the project has grown to include 12 database models, 10 controllers, 66+ API endpoints, and 26 frontend pages covering clubs, events, chat, bookmarks, volunteers, external events, announcements, and administration.

2. **Production-Grade Security**: The authentication system implements industry best practices including HttpOnly cookie-based token transport, opaque refresh tokens with rotation and reuse detection, rate limiting, and NoSQL injection prevention.

3. **Real-Time Communication**: WebSocket-based chat with rooms, message lifecycle management (send, edit, delete, react), and real-time delivery provides a modern communication experience.

4. **Hierarchical Permission System**: The four-tier global role system combined with club-scoped coordinator roles provides granular, least-privilege access control appropriate for university organizational hierarchies.

5. **Novel Features**: The coordinator draft/publish workflow, volunteer posting ecosystem, club announcements with pinning, and cross-university event discovery with editorial verification are unique features not commonly found in existing campus platforms.

6. **Scalable Architecture**: Comprehensive database indexing (30+ indexes), pagination across all list endpoints, and the modular controller architecture ensure the system can scale beyond small deployments.

### 9.2 Potential Areas for Improvement and Future Features

#### Short-Term Improvements (High Priority)

| # | Improvement | Description |
|---|------------|-------------|
| 1 | **Fix Event Model Schema** | Add missing `attendees` and `createdBy` field definitions to the Event Mongoose schema. Currently functioning via Mongoose's flexible mode but lacks validation. |
| 2 | **Fix Socket.IO Client Auth** | Update `chatSocket.js` to use cookie-based authentication instead of `localStorage.getItem("token")` which is no longer populated. |
| 3 | **Fix optionalAuth Cookie Support** | Update `optionalAuth` middleware to check `req.cookies.token` in addition to the Bearer header. |
| 4 | **Add helmet Middleware** | The `helmet` package is installed but not used. Adding `app.use(helmet())` provides HTTP security headers. |
| 5 | **Environment Variable Support (Frontend)** | Replace hardcoded `http://localhost:5000` with Vite environment variables (`import.meta.env.VITE_API_URL`). |
| 6 | **React Error Boundary** | Add error boundary components for graceful crash handling. |

#### Medium-Term Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **File Upload System** | Implement image upload for club covers, event posters, and profile pictures using Multer + Cloudinary or AWS S3. |
| 2 | **Email Verification** | Implement email-based account verification using Nodemailer with SMTP transport. |
| 3 | **Password Reset Flow** | Send password reset links via email with time-limited tokens. |
| 4 | **Push Notifications** | Browser push notifications for new messages, membership approvals, and event RSVP confirmations. |
| 5 | **Actual OCR Integration** | Replace the OCR stub with Tesseract.js or Google Vision API for automatic poster data extraction. |
| 6 | **Search Enhancement** | Implement MongoDB Atlas Search for full-text search across clubs, events, and users. |
| 7 | **Automated Testing** | Add Jest unit tests for controllers, Supertest integration tests for API endpoints, and Playwright end-to-end tests for frontend flows. |

#### Long-Term Vision

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Mobile Applications** | React Native or Flutter applications for iOS and Android with push notification support. |
| 2 | **Calendar Integration** | Google Calendar and Outlook sync for event RSVP and reminders. |
| 3 | **Analytics Dashboard** | Advanced analytics with engagement metrics, trend analysis, and exportable reports. |
| 4 | **Multi-Tenancy** | Support for multiple universities on a single deployment with tenant isolation. |
| 5 | **API Documentation** | Swagger/OpenAPI specification for public API documentation. |
| 6 | **CI/CD Pipeline** | GitHub Actions or GitLab CI for automated testing, linting, and deployment. |
| 7 | **Docker Containerization** | Dockerfiles and docker-compose for consistent development and deployment environments. |
| 8 | **Payment Integration** | Razorpay or Stripe integration for paid events and club membership fees. |
| 9 | **Internationalization** | Multi-language support using i18next for global university deployment. |
| 10 | **Accessibility Audit** | WCAG 2.1 compliance audit and remediation for inclusive access. |

---

## References

1. **Express.js 5.x Documentation** — https://expressjs.com/en/5x/api.html — Official Express framework API reference for the latest major version.

2. **Mongoose 9.x Documentation** — https://mongoosejs.com/docs/ — MongoDB ODM library documentation including schema design, middleware, and indexing.

3. **React 19 Documentation** — https://react.dev/ — Official React documentation covering hooks, context API, and the new React Compiler.

4. **Socket.IO v4 Documentation** — https://socket.io/docs/v4/ — Real-time bidirectional event-based communication framework.

5. **JSON Web Tokens (RFC 7519)** — https://datatracker.ietf.org/doc/html/rfc7519 — Internet standard for creating access tokens with JSON payloads.

6. **OWASP Authentication Cheat Sheet** — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html — Security best practices for authentication implementation.

7. **OWASP Session Management Cheat Sheet** — https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html — Guidance on secure session management including token rotation.

8. **MongoDB Security Checklist** — https://www.mongodb.com/docs/manual/administration/security-checklist/ — Security hardening recommendations for MongoDB deployments.

9. **Vite.js Documentation** — https://vite.dev/ — Next-generation frontend build tool documentation.

10. **TailwindCSS 4 Documentation** — https://tailwindcss.com/docs — Utility-first CSS framework documentation.

11. **Auth0 — Token Best Practices** — https://auth0.com/docs/secure/tokens/token-best-practices — Industry guidance on access token and refresh token management.

12. **bcrypt.js Library** — https://github.com/dcodeIO/bcrypt.js — Password hashing library implementing the bcrypt algorithm.

13. **express-rate-limit** — https://github.com/express-rate-limit/express-rate-limit — Rate limiting middleware for Express applications.

14. **express-mongo-sanitize** — https://github.com/fiznool/express-mongo-sanitize — Middleware to prevent MongoDB operator injection.

15. **react-router-dom v7** — https://reactrouter.com/ — Declarative routing for React single-page applications.

16. **Axios HTTP Client** — https://axios-http.com/docs/intro — Promise-based HTTP client for browser and Node.js with interceptor support.

17. **Node.js Crypto Module** — https://nodejs.org/api/crypto.html — Built-in cryptographic functionality for secure token generation.

18. **cookie-parser** — https://github.com/expressjs/cookie-parser — Express middleware for parsing HTTP cookies.

19. **CampusGroups** — https://www.campusgroups.com/ — Commercial campus engagement platform (comparative analysis reference).

20. **IEEE 830-1998** — IEEE Recommended Practice for Software Requirements Specifications — Standard for SRS document structure and content.

---

*End of SRS Document. This document reflects the actual state of the CampusConnect codebase as of April 15, 2026.*
