// Edit Profile Screen - Clean & Modern
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowCircleLeftIcon, CameraIcon, CalendarIcon, ClockIcon } from '../components/icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { useStore } from '../store/useStore';
import { useTheme } from '../hooks/useTheme';
import { Spacing, BorderRadius, FontSizes } from '../config/theme';
import { updateMe, uploadMedia, apiUserToUser } from '../services/api';
import { AppConfig } from '../config/appConfig';
import { useTranslation } from '../hooks/useTranslation';
import { DrumPicker, MONTHS, PICKER_HEIGHT } from '../components/DrumPicker';
import { getZodiacSign } from '../utils/zodiac';

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, updateUser, setUser } = useStore();
    const { colors, isDark } = useTheme();
    const { language } = useTranslation();

    const [nickname, setNickname] = useState(user?.nickname || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [image, setImage] = useState<string | null>(user?.profileImageUrl || null);
    const [isLoading, setIsLoading] = useState(false);

    // ── Birth date / time ───────────────────────────────────────────────
    const currentYear = new Date().getFullYear();
    const days = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1)), []);
    const years = useMemo(() => Array.from({ length: 100 }, (_, i) => String(currentYear - i)), [currentYear]);
    const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
    const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

    // Parse existing birthDate ("YYYY-MM-DD") / birthTime ("HH:MM") into picker indices
    const parsedDate = (user?.birthDate || '').split('T')[0].split('-').map(Number);
    const parsedTime = (user?.birthTime || '').split(':').map(Number);
    const [selectedDay, setSelectedDay] = useState(parsedDate[2] ? parsedDate[2] - 1 : new Date().getDate() - 1);
    const [selectedMonth, setSelectedMonth] = useState(parsedDate[1] ? parsedDate[1] - 1 : new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(parsedDate[0] ? currentYear - parsedDate[0] : 20);
    const [hasTime, setHasTime] = useState(parsedTime.length >= 2 && !isNaN(parsedTime[0]));
    const [selectedHour, setSelectedHour] = useState(!isNaN(parsedTime[0]) ? parsedTime[0] : 12);
    const [selectedMinute, setSelectedMinute] = useState(!isNaN(parsedTime[1]) ? parsedTime[1] : 0);
    const [showDateModal, setShowDateModal] = useState(false);

    const birthDateStr = `${currentYear - selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay + 1).padStart(2, '0')}`;
    const birthTimeStr = hasTime ? `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}` : '';
    const birthSummary = `${MONTHS[selectedMonth]} ${selectedDay + 1}, ${currentYear - selectedYear}${hasTime ? ` · ${birthTimeStr}` : ''}`;

    // Dynamic styles
    const bgColor = colors.background;
    const textColor = colors.text;
    const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
    const inputBg = isDark ? '#252535' : '#FFFFFF';
    const borderColor = isDark ? '#2F2F40' : '#E0E0E0';
    const placeholderColor = isDark ? '#666' : '#CCC';

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Gerekli', 'Galeriye erişim izni vermeniz gerekiyor.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!nickname.trim()) {
            Alert.alert('Error', 'Please enter a valid name.');
            return;
        }

        setIsLoading(true);

        const isGuest = !user?.id || user.id.startsWith('guest_');

        try {
            // Upload a newly picked image (local file:// URI) so it survives re-login.
            // An already-remote (http) URL is kept as-is.
            let imageUrl = image || user?.profileImageUrl;
            if (image && !/^https?:\/\//.test(image)) {
                try {
                    const { url } = await uploadMedia(image, 'image');
                    imageUrl = /^https?:\/\//.test(url) ? url : `${AppConfig.goBackendUrl}${url}`;
                } catch (e) {
                    if (__DEV__) console.warn('Image upload failed, keeping local URI:', e);
                }
            }

            const zodiacSign = getZodiacSign(birthDateStr);

            if (isGuest) {
                // Guest accounts live only on-device — persist locally.
                updateUser({
                    nickname: nickname.trim(),
                    bio: bio.trim(),
                    profileImageUrl: imageUrl,
                    birthDate: birthDateStr,
                    birthTime: hasTime ? birthTimeStr : undefined,
                    zodiacSign,
                    updatedAt: new Date().toISOString(),
                });
            } else {
                // Real account — persist to backend (source of truth), then sync store from response.
                const updated = await updateMe({
                    nickname: nickname.trim(),
                    bio: bio.trim(),
                    profile_image_url: imageUrl,
                    birth_date: birthDateStr,
                    birth_time: hasTime ? birthTimeStr : '',
                    zodiac_sign: zodiacSign,
                });
                setUser(apiUserToUser(updated, language));
            }

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Profile updated.');
            navigation.goBack();
        } catch (error: any) {
            if (__DEV__) console.error(error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error?.message || 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F5F5F5' }]}
                    >
                        <ArrowCircleLeftIcon size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Profili Düzenle</Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                        {/* Avatar Edit */}
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={{ uri: image || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
                                    style={[styles.avatar, { backgroundColor: cardBg }]}
                                />
                                <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                                    <CameraIcon size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.changePhotoText}>Profil Fotoğrafını Değiştir</Text>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formSection}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: textColor }]}>İsim</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
                                    value={nickname}
                                    onChangeText={setNickname}
                                    placeholder="Adınız"
                                    placeholderTextColor={placeholderColor}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: textColor }]}>Hakkımda</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor }]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Kendinizden bahsedin..."
                                    placeholderTextColor={placeholderColor}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: textColor }]}>Doğum Tarihi</Text>
                                <TouchableOpacity
                                    style={[styles.input, styles.dateField, { backgroundColor: inputBg, borderColor }]}
                                    onPress={() => { Haptics.selectionAsync(); setShowDateModal(true); }}
                                    activeOpacity={0.7}
                                >
                                    <CalendarIcon size={20} color="#9D4EDD" />
                                    <Text style={{ color: textColor, fontSize: 15, marginLeft: 10 }}>{birthSummary}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Kaydet</Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Birth date / time picker */}
            <Modal visible={showDateModal} transparent animationType="slide" onRequestClose={() => setShowDateModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: textColor }]}>Doğum Tarihi</Text>
                            <Text style={{ color: '#9D4EDD', fontWeight: '600' }}>{birthSummary}</Text>
                        </View>

                        <View style={styles.drumRow}>
                            <View style={{ flex: 1 }}>
                                <DrumPicker data={days} selectedIndex={selectedDay} onSelect={setSelectedDay} textSecondary={colors.textSecondary} textColor={textColor} bg={cardBg} />
                            </View>
                            <View style={{ flex: 1.3 }}>
                                <DrumPicker data={MONTHS} selectedIndex={selectedMonth} onSelect={setSelectedMonth} textSecondary={colors.textSecondary} textColor={textColor} bg={cardBg} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <DrumPicker data={years} selectedIndex={selectedYear} onSelect={setSelectedYear} textSecondary={colors.textSecondary} textColor={textColor} bg={cardBg} />
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setHasTime(!hasTime); }} style={styles.timeToggle} activeOpacity={0.7}>
                            <ClockIcon size={18} color={hasTime ? '#9D4EDD' : placeholderColor} />
                            <Text style={{ color: hasTime ? '#9D4EDD' : textColor, marginLeft: 8, fontSize: 14 }}>
                                {hasTime ? `Doğum saati: ${birthTimeStr}` : 'Doğum saati ekle (opsiyonel)'}
                            </Text>
                        </TouchableOpacity>

                        {hasTime && (
                            <View style={styles.drumRow}>
                                <View style={{ flex: 1 }}>
                                    <DrumPicker data={hours} selectedIndex={selectedHour} onSelect={setSelectedHour} textSecondary={colors.textSecondary} textColor={textColor} bg={cardBg} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <DrumPicker data={minutes} selectedIndex={selectedMinute} onSelect={setSelectedMinute} textSecondary={colors.textSecondary} textColor={textColor} bg={cardBg} />
                                </View>
                            </View>
                        )}

                        <TouchableOpacity style={styles.modalDone} onPress={() => { Haptics.selectionAsync(); setShowDateModal(false); }}>
                            <Text style={styles.modalDoneText}>Tamam</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 16
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: { padding: Spacing.lg },
    avatarSection: { alignItems: 'center', marginBottom: 32 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E0E0E0' },
    cameraButton: {
        position: 'absolute',
        right: 4,
        bottom: 4,
        backgroundColor: '#9D4EDD',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FAFAFA',
    },
    changePhotoText: { color: '#9D4EDD', fontWeight: '600', fontSize: 14 },
    formSection: { gap: 20, marginBottom: 32 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginLeft: 4 },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textArea: { minHeight: 120 },
    dateField: { flexDirection: 'row', alignItems: 'center' },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: {
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    drumRow: { flexDirection: 'row', gap: 10, height: PICKER_HEIGHT, marginTop: 8 },
    timeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    modalDone: {
        backgroundColor: '#9D4EDD', paddingVertical: 16, borderRadius: 16,
        alignItems: 'center', marginTop: 12,
    },
    modalDoneText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    saveButton: {
        backgroundColor: '#9D4EDD',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#9D4EDD",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
