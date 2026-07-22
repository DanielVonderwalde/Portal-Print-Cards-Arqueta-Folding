// ============================================
// AUTHENTICATION MODULE
// Handles login, register with invite codes, password reset
// ============================================

const Auth = {
  currentUser: null,
  userProfile: null,

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

  async login(email, password) {
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      AuditLog.log({ action: 'user_login', userId: result.user.uid, details: { email } });
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

  async validateInviteCode(code) {
    try {
      const snapshot = await db.collection('inviteCodes')
        .where('code', '==', code)
        .where('used', '==', false)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return { valid: false, error: 'Codigo de invitacion invalido o ya utilizado' };
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        valid: true,
        codeId: doc.id,
        role: data.role || 'client',
        clientName: data.clientName || '',
        assignedCompany: data.company || ''
      };
    } catch (err) {
      console.error('Error validating invite code:', err);
      return { valid: false, error: 'Error al validar el codigo' };
    }
  },

  async register(data) {
    try {
      const { email, password, name, company, inviteCode } = data;

      // Validate invite code first
      const codeResult = await Auth.validateInviteCode(inviteCode);
      if (!codeResult.valid) {
        return { success: false, error: codeResult.error };
      }

      const role = codeResult.role;
      const result = await auth.createUserWithEmailAndPassword(email, password);
      await result.user.updateProfile({ displayName: name });

      await db.collection(COLLECTIONS.USERS).doc(result.user.uid).set({
        name,
        email,
        company: company || codeResult.assignedCompany || '',
        role: role,
        inviteCode: inviteCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        avatar: null,
        phone: '',
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (role === 'client') {
        await db.collection(COLLECTIONS.CLIENTS).doc(result.user.uid).set({
          name: company || codeResult.clientName || name,
          contactName: name,
          email,
          userId: result.user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          printCardCount: 0
        });
      }

      // Mark invite code as used
      await db.collection('inviteCodes').doc(codeResult.codeId).update({
        used: true,
        usedBy: result.user.uid,
        usedByEmail: email,
        usedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      AuditLog.log({
        action: 'user_registered',
        userId: result.user.uid,
        details: { email, role, inviteCode }
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

  async resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error al enviar email de recuperacion' };
    }
  },

  async logout() {
    try {
      if (Auth.currentUser) {
        AuditLog.log({ action: 'user_logout', userId: Auth.currentUser.uid, details: {} });
      }
      await auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  },

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

  onAuthenticated() {},
  onUnauthenticated() {}
};
