import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BACKEND_URL = 'http://192.168.8.198:5000/api';

export default function MediPickApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); 
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Patient Info
  const [patientName, setPatientName] = useState('');
  const [contactNo, setContactNo] = useState('');

  // AI Scanning States
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMedicines, setScannedMedicines] = useState<any[]>([]);

  const [pharmacies, setPharmacies] = useState([]);
  const [trackingData, setTrackingData] = useState<any>(null);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Enter credentials");
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) { setIsLoggedIn(true); loadData(); }
      else Alert.alert("Failed", "Invalid login.");
    } catch (err) { Alert.alert("Error", "Backend offline"); }
    finally { setIsLoading(false); }
  };

  const loadData = async () => {
    try {
      const pharRes = await fetch(`${BACKEND_URL}/pharmacies/recommend`);
      const pharData = await pharRes.json();
      if (pharData.success) setPharmacies(pharData.data);

      const trackRes = await fetch(`${BACKEND_URL}/orders/track`);
      const trackData = await trackRes.json();
      if (trackData.success) setTrackingData(trackData.tracking);
    } catch (err) { console.log(err); }
  };

  // 🤖 AI Scan Function
  const handleAIScan = async () => {
    setIsScanning(true);
    try {
      // මෙතනදී ඇත්තටම කැමරාවෙන් ගත්තු ෆොටෝ එකක් යවන්න පුළුවන් (අනාගතයේදී)
      const res = await fetch(`${BACKEND_URL}/prescriptions/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: "dummy_image_data" }),
      });
      const data = await res.json();
      if (data.success) {
        setScannedMedicines(data.extractedMedicines);
        Alert.alert("Scan Complete", "Medicines successfully extracted using AI.");
      }
    } catch (err) {
      Alert.alert("Scanning Failed", "Could not connect to AI Engine.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmitData = async () => {
    if (!patientName || !contactNo || scannedMedicines.length === 0) {
      return Alert.alert("Error", "Scan a prescription and enter details.");
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/prescriptions/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName, contactNo, medicines: scannedMedicines }),
      });
      const data = await res.json();
      if (data.success) setActiveTab('pharmacy');
    } catch (err) { Alert.alert("Error", "Failed to upload."); }
    finally { setIsLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authView}>
        <Text style={styles.authLogoText}>MediPick AI</Text>
        <Text style={styles.authTaglineText}>Smart Vision Pharmacy Hub</Text>
        <View style={styles.authCard}>
          <TextInput placeholder="Email" style={styles.authInput} value={email} onChangeText={setEmail} autoCapitalize="none" placeholderTextColor="#94A3B8" />
          <TextInput placeholder="Password" style={styles.authInput} secureTextEntry value={password} onChangeText={setPassword} placeholderTextColor="#94A3B8" />
          <TouchableOpacity style={styles.authSubmitBtn} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authBtnText}>Login</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>MediPick AI</Text>
        <TouchableOpacity style={styles.exitButton} onPress={() => setIsLoggedIn(false)}><Text style={styles.exitText}>Exit</Text></TouchableOpacity>
      </View>

      <View style={styles.stepNavigationBar}>
        <TouchableOpacity style={[styles.stepTab, activeTab === 'upload' && styles.stepTabActive]} onPress={() => setActiveTab('upload')}>
          <Text style={[styles.stepText, activeTab === 'upload' && styles.stepTextActive]}>1. AI Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.stepTab, activeTab === 'pharmacy' && styles.stepTabActive]} onPress={() => setActiveTab('pharmacy')}>
          <Text style={[styles.stepText, activeTab === 'pharmacy' && styles.stepTextActive]}>2. Pharmacy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.stepTab, activeTab === 'tracking' && styles.stepTabActive]} onPress={() => setActiveTab('tracking')}>
          <Text style={[styles.stepText, activeTab === 'tracking' && styles.stepTextActive]}>3. Tracking</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* TAB 1: AI SCANNER UPLOAD */}
        {activeTab === 'upload' && (
          <View>
            {/* Patient Info Card */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>Patient Details</Text>
              <TextInput placeholder="Patient Name" style={styles.inputField} value={patientName} onChangeText={setPatientName} />
              <TextInput placeholder="Contact No" style={styles.inputField} keyboardType="phone-pad" value={contactNo} onChangeText={setContactNo} />
            </View>

            {/* AI Scanner Card */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeading}>Smart Prescription Scanner</Text>
              <Text style={styles.subText}>Upload an image to automatically extract medicines using AI.</Text>
              
              <TouchableOpacity style={styles.scanBtn} onPress={handleAIScan} disabled={isScanning}>
                {isScanning ? (
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    <ActivityIndicator color="#FFF" style={{marginRight: 10}}/>
                    <Text style={styles.scanBtnText}>Analyzing Handwriting...</Text>
                  </View>
                ) : (
                  <Text style={styles.scanBtnText}>📷 Tap to Scan Image</Text>
                )}
              </TouchableOpacity>

              {/* Extracted Medicines View */}
              {scannedMedicines.length > 0 && (
                <View style={styles.extractedBox}>
                  <Text style={styles.extractedHeading}>✅ Extracted Medicines:</Text>
                  {scannedMedicines.map((med, index) => (
                    <View key={index} style={styles.medicinePill}>
                      <Text style={styles.medicineName}>💊 {med.name}</Text>
                      <View style={styles.medicineBadge}><Text style={styles.medicineDosage}>{med.dosage}</Text></View>
                    </View>
                  ))}
                  
                  <TouchableOpacity style={styles.submitDataBtn} onPress={handleSubmitData}>
                    <Text style={styles.submitDataBtnText}>Search Pharmacies for Above</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB 2: PHARMACIES */}
        {activeTab === 'pharmacy' && (
          <View>
            <Text style={styles.sectionHeading}>Recommended for Your Scan</Text>
            {pharmacies.map((pharmacy: any) => (
              <View key={pharmacy.id} style={styles.pharmacyProfileCard}>
                <View style={styles.pharmacyCardHeader}>
                  <Text style={styles.pharmacyMainTitleText}>{pharmacy.name}</Text>
                  <Text style={{color: '#D97706', fontWeight: 'bold'}}>⭐ {pharmacy.rating}</Text>
                </View>
                <Text style={{color: '#475569', marginBottom: 5}}>📍 {pharmacy.district} | 📞 {pharmacy.phone}</Text>
                <View style={styles.pharmacyCardFooter}>
                  <Text style={{fontWeight:'bold', color: pharmacy.stock === 'Available' ? '#15803D' : '#B91C1C'}}>📦 {pharmacy.stock}</Text>
                  <TouchableOpacity style={styles.pharmacySelectBtn} onPress={() => setActiveTab('tracking')}>
                    <Text style={{color: '#2563EB', fontWeight: 'bold'}}>Request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: TRACKING */}
        {activeTab === 'tracking' && trackingData && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeading}>Order Journey</Text>
            <Text style={styles.subText}>ID: {trackingData.orderId}</Text>
            <View style={{marginTop: 15}}>
              {trackingData.stages.map((stage: any) => {
                const isDone = stage.id <= trackingData.currentStage;
                return (
                  <View key={stage.id} style={{flexDirection:'row', marginBottom: 20}}>
                    <View style={[styles.trackDot, isDone ? {backgroundColor: '#2563EB'} : {backgroundColor: '#CBD5E1'}]} />
                    <View style={{flex: 1, paddingLeft: 15}}>
                      <Text style={{fontSize: 15, fontWeight: 'bold', color: isDone ? '#0F172A' : '#64748B'}}>{stage.title}</Text>
                      <Text style={{fontSize: 12, color: '#64748B', marginTop: 3}}>{stage.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  authView: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 24 },
  authLogoText: { fontSize: 38, fontWeight: 'bold', color: '#38BDF8', textAlign: 'center' },
  authTaglineText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 30 },
  authCard: { backgroundColor: '#1E293B', padding: 24, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
  authInput: { backgroundColor: '#0F172A', height: 50, borderRadius: 12, paddingHorizontal: 16, color: '#FFF', marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  authSubmitBtn: { backgroundColor: '#38BDF8', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  authBtnText: { color: '#0F172A', fontSize: 16, fontWeight: 'bold' },
  
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  appTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E3A8A' },
  exitButton: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15 },
  exitText: { color: '#EF4444', fontWeight: 'bold' },
  
  stepNavigationBar: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  stepTab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  stepTabActive: { borderBottomWidth: 3, borderColor: '#2563EB' },
  stepText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  stepTextActive: { color: '#2563EB', fontWeight: 'bold' },
  
  scrollContainer: { padding: 15 },
  cardSection: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  sectionHeading: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 5 },
  subText: { fontSize: 12, color: '#64748B', marginBottom: 15 },
  inputField: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, marginBottom: 15 },
  
  // AI Scanner Styles
  scanBtn: { backgroundColor: '#8B5CF6', padding: 15, borderRadius: 12, alignItems: 'center', marginVertical: 10 },
  scanBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  extractedBox: { marginTop: 15, backgroundColor: '#F5F3FF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#DDD6FE' },
  extractedHeading: { fontWeight: 'bold', color: '#5B21B6', marginBottom: 10 },
  medicinePill: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#EDE9FE' },
  medicineName: { fontWeight: '600', color: '#334155' },
  medicineBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  medicineDosage: { fontSize: 12, fontWeight: 'bold', color: '#6D28D9' },
  submitDataBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  submitDataBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  // Pharmacy Cards
  pharmacyProfileCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  pharmacyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  pharmacyMainTitleText: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  pharmacyCardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 10, marginTop: 5 },
  pharmacySelectBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  
  trackDot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 }
});