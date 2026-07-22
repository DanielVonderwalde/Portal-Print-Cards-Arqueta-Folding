// ============================================
// SIGNATURE MODULE
// Canvas-based digital signature with full audit trail
// ============================================

const SignaturePad = {
  canvas: null,
  ctx: null,
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  isEmpty: true,

  init(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.setupEvents();
    this.clear();
  },

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = 200 * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = '200px';
    this.ctx.scale(dpr, dpr);
    this.ctx.strokeStyle = '#1a2332';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  },

  setupEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrawing(touch);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw(touch);
    });
    this.canvas.addEventListener('touchend', () => this.stopDrawing());

    // Resize
    window.addEventListener('resize', debounce(() => {
      const imageData = this.canvas.toDataURL();
      this.resize();
      if (!this.isEmpty) {
        const img = new Image();
        img.onload = () => this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        img.src = imageData;
      }
    }, 250));
  },

  getPosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX || e.pageX) - rect.left,
      y: (e.clientY || e.pageY) - rect.top
    };
  },

  startDrawing(e) {
    this.isDrawing = true;
    const pos = this.getPosition(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
    this.isEmpty = false;
  },

  draw(e) {
    if (!this.isDrawing) return;
    const pos = this.getPosition(e);

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();

    this.lastX = pos.x;
    this.lastY = pos.y;
  },

  stopDrawing() {
    this.isDrawing = false;
  },

  clear() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    this.isEmpty = true;
  },

  toDataURL() {
    return this.canvas.toDataURL('image/png');
  },

  isBlank() {
    return this.isEmpty;
  }
};

// Signature Service - handles saving and verification
const SignatureService = {

  // Sign a print card
  async signPrintCard(printCardId, signatureData, signerInfo) {
    try {
      const signatureId = db.collection(COLLECTIONS.SIGNATURES).doc().id;

      // Signature data is already base64 from canvas.toDataURL - save directly

      // Create signature record
      const signatureRecord = {
        id: signatureId,
        printCardId,
        signedBy: Auth.currentUser.uid,
        signerName: signerInfo.name,
        signerEmail: signerInfo.email,
        signerTitle: signerInfo.title || '',
        signerCompany: signerInfo.company || '',
        signatureImageURL: signatureData,
        signedAt: firebase.firestore.FieldValue.serverTimestamp(),
        ipAddress: 'captured-server-side',
        userAgent: navigator.userAgent,
        status: signerInfo.action, // 'approved' or 'rejected'
        comments: signerInfo.comments || '',
        // Signature hash for verification
        hash: await this.generateHash(signatureData + printCardId + Date.now())
      };

      await db.collection(COLLECTIONS.SIGNATURES).doc(signatureId).set(signatureRecord);

      // Update print card status
      const newStatus = signerInfo.action === 'approved' ? 'approved' : 'rejected';
      await db.collection(COLLECTIONS.PRINT_CARDS).doc(printCardId).update({
        status: newStatus,
        lastSignatureId: signatureId,
        [`statusHistory.${newStatus}`]: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Audit log
      AuditLog.log({
        action: `printcard_${newStatus}`,
        userId: Auth.currentUser.uid,
        printCardId,
        signatureId,
        details: {
          signerName: signerInfo.name,
          action: signerInfo.action
        }
      });

      // Create notification for the uploader
      const printCard = await db.collection(COLLECTIONS.PRINT_CARDS).doc(printCardId).get();
      if (printCard.exists) {
        const pcData = printCard.data();
        await db.collection(COLLECTIONS.NOTIFICATIONS).add({
          userId: pcData.uploadedBy,
          type: `printcard_${newStatus}`,
          title: newStatus === 'approved' ? 'Print Card Aprobado' : 'Print Card Rechazado',
          message: `${signerInfo.name} ha ${newStatus === 'approved' ? 'aprobado' : 'rechazado'} "${pcData.name}"`,
          printCardId,
          read: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      return { success: true, signatureId };
    } catch (err) {
      console.error('Error signing:', err);
      return { success: false, error: 'Error al firmar el documento' };
    }
  },

  // Get signatures for a print card
  async getSignatures(printCardId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.SIGNATURES)
        .where('printCardId', '==', printCardId)
        .orderBy('signedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching signatures:', err);
      return [];
    }
  },

  // Generate hash for verification
  async generateHash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Verify signature
  async verifySignature(signatureId) {
    try {
      const doc = await db.collection(COLLECTIONS.SIGNATURES).doc(signatureId).get();
      if (!doc.exists) return { valid: false, error: 'Signature not found' };
      return { valid: true, signature: doc.data() };
    } catch (err) {
      return { valid: false, error: 'Verification failed' };
    }
  }
};
// ============================================
// SIGNATURE MODULE
// Canvas-based digital signature with full audit trail
// ============================================

const SignaturePad = {
  canvas: null,
  ctx: null,
  isDrawing: false,
  lastX: 0,
  lastY: 0,
  isEmpty: true,

  init(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.setupEvents();
    this.clear();
  },

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = 200 * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = '200px';
    this.ctx.scale(dpr, dpr);
    this.ctx.strokeStyle = '#1a2332';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  },

  setupEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrawing(touch);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw(touch);
    });
    this.canvas.addEventListener('touchend', () => this.stopDrawing());

    // Resize
    window.addEventListener('resize', debounce(() => {
      const imageData = this.canvas.toDataURL();
      this.resize();
      if (!this.isEmpty) {
        const img = new Image();
        img.onload = () => this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        img.src = imageData;
      }
    }, 250));
  },

  getPosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX || e.pageX) - rect.left,
      y: (e.clientY || e.pageY) - rect.top
    };
  },

  startDrawing(e) {
    this.isDrawing = true;
    const pos = this.getPosition(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
    this.isEmpty = false;
  },

  draw(e) {
    if (!this.isDrawing) return;
    const pos = this.getPosition(e);

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();

    this.lastX = pos.x;
    this.lastY = pos.y;
  },

  stopDrawing() {
    this.isDrawing = false;
  },

  clear() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    this.isEmpty = true;
  },

  toDataURL() {
    return this.canvas.toDataURL('image/png');
  },

  isBlank() {
    return this.isEmpty;
  }
};

// Signature Service - handles saving and verification
const SignatureService = {

  // Sign a print card
  async signPrintCard(printCardId, signatureData, signerInfo) {
    try {
      const signatureId = db.collection(COLLECTIONS.SIGNATURES).doc().id;

      // Upload signature image to Storage
      const signatureRef = storage.ref(`${STORAGE_PATHS.SIGNATURES}/${signatureId}.png`);
      const base64Data = signatureData.split(',')[1];
      await signatureRef.putString(base64Data, 'base64', { contentType: 'image/png' });
      const signatureURL = await signatureRef.getDownloadURL();

      // Create signature record
      const signatureRecord = {
        id: signatureId,
        printCardId,
        signedBy: Auth.currentUser.uid,
        signerName: signerInfo.name,
        signerEmail: signerInfo.email,
        signerTitle: signerInfo.title || '',
        signerCompany: signerInfo.company || '',
        signatureImageURL: signatureURL,
        signedAt: firebase.firestore.FieldValue.serverTimestamp(),
        ipAddress: 'captured-server-side',
        userAgent: navigator.userAgent,
        status: signerInfo.action, // 'approved' or 'rejected'
        comments: signerInfo.comments || '',
        // Signature hash for verification
        hash: await this.generateHash(signatureData + printCardId + Date.now())
      };

      await db.collection(COLLECTIONS.SIGNATURES).doc(signatureId).set(signatureRecord);

      // Update print card status
      const newStatus = signerInfo.action === 'approved' ? 'approved' : 'rejected';
      await db.collection(COLLECTIONS.PRINT_CARDS).doc(printCardId).update({
        status: newStatus,
        lastSignatureId: signatureId,
        [`statusHistory.${newStatus}`]: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Audit log
      AuditLog.log({
        action: `printcard_${newStatus}`,
        userId: Auth.currentUser.uid,
        printCardId,
        signatureId,
        details: {
          signerName: signerInfo.name,
          action: signerInfo.action
        }
      });

      // Create notification for the uploader
      const printCard = await db.collection(COLLECTIONS.PRINT_CARDS).doc(printCardId).get();
      if (printCard.exists) {
        const pcData = printCard.data();
        await db.collection(COLLECTIONS.NOTIFICATIONS).add({
          userId: pcData.uploadedBy,
          type: `printcard_${newStatus}`,
          title: newStatus === 'approved' ? 'Print Card Aprobado' : 'Print Card Rechazado',
          message: `${signerInfo.name} ha ${newStatus === 'approved' ? 'aprobado' : 'rechazado'} "${pcData.name}"`,
          printCardId,
          read: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      return { success: true, signatureId };
    } catch (err) {
      console.error('Error signing:', err);
      return { success: false, error: 'Error al firmar el documento' };
    }
  },

  // Get signatures for a print card
  async getSignatures(printCardId) {
    try {
      const snapshot = await db.collection(COLLECTIONS.SIGNATURES)
        .where('printCardId', '==', printCardId)
        .orderBy('signedAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error fetching signatures:', err);
      return [];
    }
  },

  // Generate hash for verification
  async generateHash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Verify signature
  async verifySignature(signatureId) {
    try {
      const doc = await db.collection(COLLECTIONS.SIGNATURES).doc(signatureId).get();
      if (!doc.exists) return { valid: false, error: 'Signature not found' };
      return { valid: true, signature: doc.data() };
    } catch (err) {
      return { valid: false, error: 'Verification failed' };
    }
  }
};
