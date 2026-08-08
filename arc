                 User
                   │
                   ▼
            Login / Signup
                   │
         bcrypt + JWT Cookie
                   │
                   ▼
        Authentication Middleware
                   │
          ┌────────┴────────┐
          ▼                 ▼
     Dashboard          Payment
          │                 │
          │                 ▼
          │          Update isPremium
          │                 │
          └────────┬────────┘
                   ▼
             Chat Room (Socket.IO)
                   │
                   ▼
               MongoDB Atlas