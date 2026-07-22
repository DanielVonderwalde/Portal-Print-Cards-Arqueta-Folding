// ============================================
// AUTHENTICATION MODULE
// Handles login, register, password reset, and role management
// ============================================

const Auth = {
  currentUser: null,
  userProfile: null,

  // Initialize auth state listener
  init() {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        Auth.currentUser = user;
        try {
          const profile = await db.collection(COLLECTIONS.USERS).doc(user.uid).get();
          if (profile.exists) {
            Auth.userProfile = { id: user.uid, ...profile.data() };
            Auth.onAuthenticated();
          } else {
            // First time - shouldn't happen if registered properly
            auth.signOut();
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          Toast.show('Error loading profile', 'error');
        }
      } else {
        Auth.currentUser = null;
        Auth.userProfile = null;
        Auth.onUnauthenticated();
      }
    });
  },

  // Login with email/password
  async login(email, password) {
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);

      // Log audit
      AuditLog.log({
        action: 'user_login',
        userId: result.user.uid,
        details: { email }
      });

      return { success: true };
    } catch (err) {
      let message = 'Error al iniciar sesion';
      switch (err.code) {
        case 'auth/user-not-found': message = 'No existe una cuenta con este email'; break;
        case 'auth/wrong-password': message = 'Contrasena incorrecta'; break;
        case 'auth/invalid-email': message = 'Email invalido'; break;
        case 'auth/too-many-requests': message = 'Demasiados intentos. Intenta mas tarde'; break;
      }
      return { success: false, error: message };
    }
  },

  // Register new user
  async register(data) {
    try {
      const { email, password, name, company, role } = data;

      const result = await auth.createUserWithEmailAndPassword(email, password);

      // Update display name
      await result.user.updateProfile({ displayName: name });

      // Create user profile in Firestore
      await db.collection(COLLECTIONS.USERS).doc(result.user.uid).set({
        name,
        email,
        company: company || '',
        role: role || 'client', // admin, designer, client
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        avatar: null,
        phone: '',
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      // If registering a client, also create client record
      if (role === 'client') {
        await db.collection(COLLECTIONS.CLIENTS).doc(result.user.uid).set({
          name: company || name,
          contactName: name,
          email,
          userId: result.user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          printCardCount: 0
        });
      }

      AuditLog.log({
        action: 'user_registered',
        userId: result.user.uid,
        details: { email, role }
      });

      return { success: true };
    } catch (err) {
      let message = 'Error al registrarse';
      switch (err.code) {
        case 'auth/email-already-in-use': message = 'Ya existe una cuenta con este email'; break;
        case 'auth/weak-password': message = 'La contrasena debe tener al menos 6 caracteres'; break;
        case 'auth/invalid-email': message = 'Email invalido'; break;
      }
      return { success: false, error: message };
    }
  },

  // Send password reset email
  async resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error al enviar email de recuperacion' };
    }
  },

  // Logout
  async logout() {
    try {
      if (Auth.currentUser) {
        AuditLog.log({
          action: 'user_logout',
          userId: Auth.currentUser.uid,
          details: {}
        });
      }
      await auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  },

  // Update user profile
  async updateProfile(data) {
    if (!Auth.currentUser) return { success: false };
    try {
      await db.collection(COLLECTIONS.USERS).doc(Auth.currentUser.uid).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      Auth.userProfile = { ...Auth.userProfile, ...data };
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error updating profile' };
    }
  },

  // Create user by admin (invite client/designer)
  async createUser(data) {
    // This would typically use Firebase Admin SDK via Cloud Functions
    // For now, we create a pending invitation
    try {
      const inviteId = db.collection('invitations').doc().id;
      await db.collection('invitations').doc(inviteId).set({
        email: data.email,
        name: data.name,
        company: data.company || '',
        role: data.role,
        invitedBy: Auth.currentUser.uid,
        invitedByName: Auth.userProfile.name,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        token: inviteId
      });

      return { success: true, inviteId };
    } catch (err) {
      return { success: false, error: 'Error creating invitation' };
    }
  },

  // Callbacks - overridden by app
  onAuthenticated() {},
  onUnauthenticated() {}
};
