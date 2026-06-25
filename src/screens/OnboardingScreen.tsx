// Onboarding Screen — 4-step modern dark-first flow (Name → Gender → BirthDate → BirthPlace+Summary)
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    FlatList,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TickCircleIcon, ClockIcon, ArrowCircleLeftIcon } from '../components/icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';

import { useStore } from '../store/useStore';
import { updateMe } from '../services/api';
import { getZodiacSign } from '../utils/zodiac';
import { DrumPicker, MONTHS, PICKER_HEIGHT } from '../components/DrumPicker';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../components/Toast';
import { tracker } from '../services/eventTracker';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const FemaleIcon = ({ color, size = 44 }: { color: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="9" r="5" stroke={color} strokeWidth="1.8" fill="none" />
        <Path d="M12 14V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M9 18H15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

const MaleIcon = ({ color, size = 44 }: { color: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="10" cy="14" r="5" stroke={color} strokeWidth="1.8" fill="none" />
        <Path d="M19 5L13.5 10.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M19 5H15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M19 5V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

const NonBinaryIcon = ({ color, size = 44 }: { color: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="14" r="5" stroke={color} strokeWidth="1.8" fill="none" />
        <Path d="M12 9V3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M9.5 5.5L12 3L14.5 5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M8 20L6 23" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M16 20L18 23" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

// ─── Country Data with Flags ─────────────────────────────────────────────────

interface CountryData {
    name: string;
    flag: string;
    cities: string[];
}

const COUNTRIES: CountryData[] = [
    { name: 'Turkey', flag: '🇹🇷', cities: ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Diyarbakir', 'Kayseri', 'Eskisehir', 'Samsun', 'Denizli', 'Sanliurfa', 'Malatya', 'Trabzon', 'Erzurum', 'Van', 'Batman', 'Elazig', 'Manisa', 'Balikesir', 'Sakarya', 'Mugla', 'Tekirdag', 'Aydin', 'Ordu', 'Hatay', 'Afyon', 'Edirne', 'Bolu', 'Kastamonu', 'Kirklareli', 'Canakkale', 'Rize', 'Artvin', 'Isparta', 'Usak', 'Kutahya', 'Nevsehir', 'Yozgat', 'Corum', 'Amasya', 'Tokat', 'Giresun', 'Sinop', 'Bartin', 'Zonguldak', 'Duzce', 'Karabuk', 'Kocaeli', 'Yalova', 'Bilecik', 'Burdur', 'Kirikkale', 'Kirsehir', 'Nigde', 'Aksaray', 'Karaman', 'Tunceli', 'Bingol', 'Mus', 'Bitlis', 'Siirt', 'Sirnak', 'Hakkari', 'Igdir', 'Agri', 'Kars', 'Ardahan', 'Osmaniye', 'Kilis', 'Mardin', 'Adiyaman', 'Kahramanmaras'] },
    { name: 'United States', flag: '🇺🇸', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'San Francisco', 'Seattle', 'Denver', 'Boston', 'Miami', 'Atlanta', 'Las Vegas', 'Portland', 'Detroit', 'Minneapolis', 'Nashville', 'Charlotte'] },
    { name: 'United Kingdom', flag: '🇬🇧', cities: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff', 'Belfast', 'Leicester', 'Nottingham', 'Newcastle', 'Brighton', 'Oxford', 'Cambridge', 'Southampton', 'Aberdeen'] },
    { name: 'Germany', flag: '🇩🇪', cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dusseldorf', 'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bonn'] },
    { name: 'France', flag: '🇫🇷', cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Toulon', 'Grenoble', 'Dijon', 'Angers'] },
    { name: 'Spain', flag: '🇪🇸', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Malaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante', 'Cordoba', 'Valladolid', 'Granada', 'Oviedo'] },
    { name: 'Italy', flag: '🇮🇹', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Venice', 'Verona', 'Bari', 'Catania', 'Messina', 'Padua'] },
    { name: 'Netherlands', flag: '🇳🇱', cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'] },
    { name: 'Belgium', flag: '🇧🇪', cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liege', 'Bruges', 'Namur', 'Leuven', 'Mons'] },
    { name: 'Switzerland', flag: '🇨🇭', cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen'] },
    { name: 'Austria', flag: '🇦🇹', cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels'] },
    { name: 'Canada', flag: '🇨🇦', cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Halifax'] },
    { name: 'Australia', flag: '🇦🇺', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle', 'Hobart', 'Darwin'] },
    { name: 'Brazil', flag: '🇧🇷', cities: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'] },
    { name: 'India', flag: '🇮🇳', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Surat', 'Kanpur'] },
    { name: 'Japan', flag: '🇯🇵', cities: ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Kobe', 'Kyoto', 'Fukuoka', 'Hiroshima', 'Sendai'] },
    { name: 'South Korea', flag: '🇰🇷', cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Suwon', 'Changwon'] },
    { name: 'China', flag: '🇨🇳', cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xian', 'Chongqing', 'Nanjing'] },
    { name: 'Russia', flag: '🇷🇺', cities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Samara', 'Omsk', 'Rostov-on-Don'] },
    { name: 'Mexico', flag: '🇲🇽', cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Leon', 'Ciudad Juarez', 'Cancun', 'Merida'] },
    { name: 'Argentina', flag: '🇦🇷', cities: ['Buenos Aires', 'Cordoba', 'Rosario', 'Mendoza', 'La Plata', 'Tucuman', 'Mar del Plata', 'Salta'] },
    { name: 'Colombia', flag: '🇨🇴', cities: ['Bogota', 'Medellin', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira'] },
    { name: 'Poland', flag: '🇵🇱', cities: ['Warsaw', 'Krakow', 'Wroclaw', 'Lodz', 'Poznan', 'Gdansk', 'Szczecin', 'Lublin', 'Katowice'] },
    { name: 'Sweden', flag: '🇸🇪', cities: ['Stockholm', 'Gothenburg', 'Malmo', 'Uppsala', 'Linkoping', 'Orebro', 'Vasteras', 'Helsingborg'] },
    { name: 'Norway', flag: '🇳🇴', cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Tromso', 'Kristiansand'] },
    { name: 'Denmark', flag: '🇩🇰', cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Horsens'] },
    { name: 'Finland', flag: '🇫🇮', cities: ['Helsinki', 'Espoo', 'Tampere', 'Oulu', 'Turku', 'Jyvaskyla', 'Lahti', 'Kuopio'] },
    { name: 'Ireland', flag: '🇮🇪', cities: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Drogheda'] },
    { name: 'Portugal', flag: '🇵🇹', cities: ['Lisbon', 'Porto', 'Braga', 'Coimbra', 'Funchal', 'Faro', 'Aveiro', 'Evora'] },
    { name: 'Greece', flag: '🇬🇷', cities: ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Ioannina', 'Rhodes'] },
    { name: 'Romania', flag: '🇷🇴', cities: ['Bucharest', 'Cluj-Napoca', 'Timisoara', 'Iasi', 'Constanta', 'Craiova', 'Brasov', 'Galati'] },
    { name: 'Hungary', flag: '🇭🇺', cities: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pecs', 'Gyor', 'Kecskemet'] },
    { name: 'Czech Republic', flag: '🇨🇿', cities: ['Prague', 'Brno', 'Ostrava', 'Plzen', 'Liberec', 'Olomouc', 'Ceske Budejovice'] },
    { name: 'Bulgaria', flag: '🇧🇬', cities: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven'] },
    { name: 'Croatia', flag: '🇭🇷', cities: ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Dubrovnik', 'Pula'] },
    { name: 'Serbia', flag: '🇷🇸', cities: ['Belgrade', 'Novi Sad', 'Nis', 'Kragujevac', 'Subotica', 'Zrenjanin'] },
    { name: 'Ukraine', flag: '🇺🇦', cities: ['Kyiv', 'Kharkiv', 'Odessa', 'Dnipro', 'Lviv', 'Zaporizhzhia', 'Vinnytsia'] },
    { name: 'Egypt', flag: '🇪🇬', cities: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Port Said', 'Suez'] },
    { name: 'Morocco', flag: '🇲🇦', cities: ['Casablanca', 'Rabat', 'Marrakech', 'Fez', 'Tangier', 'Agadir', 'Meknes'] },
    { name: 'South Africa', flag: '🇿🇦', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'] },
    { name: 'Nigeria', flag: '🇳🇬', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna'] },
    { name: 'Saudi Arabia', flag: '🇸🇦', cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Tabuk', 'Abha'] },
    { name: 'UAE', flag: '🇦🇪', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras Al Khaimah', 'Fujairah'] },
    { name: 'Israel', flag: '🇮🇱', cities: ['Tel Aviv', 'Jerusalem', 'Haifa', 'Beer Sheva', 'Netanya', 'Ashdod', 'Eilat'] },
    { name: 'Iran', flag: '🇮🇷', cities: ['Tehran', 'Mashhad', 'Isfahan', 'Shiraz', 'Tabriz', 'Ahvaz', 'Kerman'] },
    { name: 'Pakistan', flag: '🇵🇰', cities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan'] },
    { name: 'Indonesia', flag: '🇮🇩', cities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Denpasar', 'Yogyakarta'] },
    { name: 'Thailand', flag: '🇹🇭', cities: ['Bangkok', 'Chiang Mai', 'Pattaya', 'Phuket', 'Hat Yai', 'Nakhon Ratchasima'] },
    { name: 'Philippines', flag: '🇵🇭', cities: ['Manila', 'Quezon City', 'Davao', 'Cebu', 'Zamboanga', 'Makati'] },
    { name: 'Malaysia', flag: '🇲🇾', cities: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Ipoh', 'Kota Kinabalu', 'Malacca'] },
    { name: 'Singapore', flag: '🇸🇬', cities: ['Singapore'] },
    { name: 'New Zealand', flag: '🇳🇿', cities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin'] },
    { name: 'Chile', flag: '🇨🇱', cities: ['Santiago', 'Valparaiso', 'Concepcion', 'La Serena', 'Temuco', 'Antofagasta'] },
    { name: 'Peru', flag: '🇵🇪', cities: ['Lima', 'Arequipa', 'Cusco', 'Trujillo', 'Chiclayo', 'Piura'] },
    { name: 'Iraq', flag: '🇮🇶', cities: ['Baghdad', 'Basra', 'Erbil', 'Mosul', 'Sulaymaniyah', 'Kirkuk', 'Najaf'] },
    { name: 'Georgia', flag: '🇬🇪', cities: ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Zugdidi'] },
    { name: 'Armenia', flag: '🇦🇲', cities: ['Yerevan', 'Gyumri', 'Vanadzor', 'Vagharshapat', 'Hrazdan'] },
    { name: 'Azerbaijan', flag: '🇦🇿', cities: ['Baku', 'Ganja', 'Sumqayit', 'Mingachevir', 'Lankaran'] },
    { name: 'Albania', flag: '🇦🇱', cities: ['Tirana', 'Durres', 'Vlore', 'Elbasan', 'Shkoder', 'Korce'] },
    { name: 'Bosnia', flag: '🇧🇦', cities: ['Sarajevo', 'Banja Luka', 'Tuzla', 'Zenica', 'Mostar'] },
    { name: 'North Macedonia', flag: '🇲🇰', cities: ['Skopje', 'Bitola', 'Kumanovo', 'Ohrid', 'Tetovo'] },
    { name: 'Kosovo', flag: '🇽🇰', cities: ['Pristina', 'Prizren', 'Peja', 'Mitrovica', 'Gjilan'] },
    { name: 'Montenegro', flag: '🇲🇪', cities: ['Podgorica', 'Niksic', 'Budva', 'Herceg Novi', 'Bar'] },
    { name: 'Iceland', flag: '🇮🇸', cities: ['Reykjavik', 'Akureyri', 'Kopavogur', 'Hafnarfjordur'] },
    { name: 'Luxembourg', flag: '🇱🇺', cities: ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange'] },
    { name: 'Malta', flag: '🇲🇹', cities: ['Valletta', 'Birkirkara', 'Sliema', 'Mosta', 'Qormi'] },
    { name: 'Cyprus', flag: '🇨🇾', cities: ['Nicosia', 'Limassol', 'Larnaca', 'Paphos', 'Famagusta'] },
    { name: 'Estonia', flag: '🇪🇪', cities: ['Tallinn', 'Tartu', 'Narva', 'Parnu'] },
    { name: 'Latvia', flag: '🇱🇻', cities: ['Riga', 'Daugavpils', 'Liepaja', 'Jelgava'] },
    { name: 'Lithuania', flag: '🇱🇹', cities: ['Vilnius', 'Kaunas', 'Klaipeda', 'Siauliai', 'Panevezys'] },
    { name: 'Slovakia', flag: '🇸🇰', cities: ['Bratislava', 'Kosice', 'Presov', 'Zilina', 'Nitra', 'Banska Bystrica'] },
    { name: 'Slovenia', flag: '🇸🇮', cities: ['Ljubljana', 'Maribor', 'Celje', 'Kranj', 'Koper'] },
    { name: 'Kenya', flag: '🇰🇪', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'] },
    { name: 'Tunisia', flag: '🇹🇳', cities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte'] },
    { name: 'Vietnam', flag: '🇻🇳', cities: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho', 'Nha Trang'] },
];

// ─── Months ──────────────────────────────────────────────────────────────────


// ─── Main Component ──────────────────────────────────────────────────────────

export const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { user, setUser } = useStore();
    const { isDark } = useTheme();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [step, setStep] = useState(1);
    const totalSteps = 4;

    useEffect(() => {
      tracker.track('onboarding_step', { step });
    }, [step]);

    // Step 1: Name
    const [fullName, setFullName] = useState(user?.nickname && user.nickname !== 'Guest' ? user.nickname : '');

    // Step 2: Gender
    const [gender, setGender] = useState<'female' | 'male' | 'other' | ''>('');

    // Step 3: Birth Date
    const currentYear = new Date().getFullYear();
    const [selectedDay, setSelectedDay] = useState(new Date().getDate() - 1);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(20);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Step 4: Birth Place
    const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [city, setCity] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [showCityModal, setShowCityModal] = useState(false);

    // Data
    const days = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1)), []);
    const years = useMemo(() => Array.from({ length: 100 }, (_, i) => String(currentYear - i)), [currentYear]);
    const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
    const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

    const filteredCountries = useMemo(() => {
        if (!countrySearch.trim()) return COUNTRIES;
        const q = countrySearch.toLowerCase();
        return COUNTRIES.filter(c => c.name.toLowerCase().includes(q));
    }, [countrySearch]);

    const filteredCities = useMemo(() => {
        if (!selectedCountry) return [];
        if (!citySearch.trim()) return selectedCountry.cities;
        const q = citySearch.toLowerCase();
        return selectedCountry.cities.filter(c => c.toLowerCase().includes(q));
    }, [selectedCountry, citySearch]);

    // Theme
    const bg = isDark ? '#0F0F1A' : '#F8F9FA';
    const text = isDark ? '#FFFFFF' : '#1C1C1E';
    const textSecondary = isDark ? '#8E8E93' : '#666666';
    const cardBg = isDark ? '#1A1A2E' : '#FFFFFF';
    const border = isDark ? '#2F2F40' : '#E5E5EA';
    const inputBg = isDark ? '#252535' : '#F0F0F5';

    // ─── Navigation ──────────────────────────────────────────────────────

    const handleNext = async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!validateStep(step)) return;
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleSave();
        }
    };

    const handleBack = () => { if (step > 1) setStep(step - 1); };

    const validateStep = (s: number): boolean => {
        if (s === 1 && !fullName.trim()) { showToast('error', 'Please enter your name'); return false; }
        if (s === 2 && !gender) { showToast('error', 'Please select your gender'); return false; }
        return true;
    };

    // ─── Save ────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setIsLoading(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const yearValue = currentYear - selectedYear;
            const monthValue = selectedMonth + 1;
            const dayValue = selectedDay + 1;
            const birthDate = `${yearValue}-${String(monthValue).padStart(2, '0')}-${String(dayValue).padStart(2, '0')}`;
            const birthTime = selectedHour !== null && selectedMinute !== null
                ? `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
                : undefined;
            const countryName = selectedCountry?.name || '';
            const birthCity = city ? `${city}, ${countryName}` : countryName;

            const zodiacSign = getZodiacSign(birthDate);
            const updates: Record<string, any> = {
                nickname: fullName.trim(),
                gender,
                birth_date: birthDate,
                birth_city: birthCity,
                zodiac_sign: zodiacSign,
                onboarding_completed: true,
            };
            if (birthTime) updates.birth_time = birthTime;

            if (__DEV__) console.log('Onboarding save:', updates);

            if (user?.id) {
                const updated = await updateMe(updates);
                if (updated) {
                    setUser({
                        ...user,
                        nickname: fullName.trim(),
                        birthDate: updated.birth_date,
                        birthTime: updated.birth_time,
                        birthCity: updated.birth_city,
                        zodiacSign: updated.zodiac_sign,
                        onboardingCompleted: true,
                        updatedAt: new Date().toISOString(),
                    });
                }
            } else {
                // Guest — just update local store
                if (user) {
                    setUser({
                        ...user,
                        nickname: fullName.trim(),
                        onboardingCompleted: true,
                        updatedAt: new Date().toISOString(),
                    });
                }
            }

            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            tracker.track('onboarding_complete', { steps: totalSteps });
            showToast('success', 'Welcome to Kosmos!', 'Your profile is set up');
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        } catch (error) {
            if (__DEV__) console.error('Onboarding save error:', error);
            showToast('error', 'Something went wrong', 'Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── Step 1: Name ────────────────────────────────────────────────────

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: text }]}>{t('whatsYourName')}</Text>
            <Text style={[styles.stepDesc, { color: textSecondary }]}>
                This will be your display name in the app
            </Text>
            <TextInput
                style={[styles.bigInput, { backgroundColor: inputBg, color: text, borderColor: border }]}
                placeholder={t('enterYourName')}
                placeholderTextColor={textSecondary}
                value={fullName}
                onChangeText={setFullName}
                autoFocus
                maxLength={30}
            />
        </View>
    );

    // ─── Step 2: Gender ──────────────────────────────────────────────────

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: text }]}>{t('yourGender')}</Text>
            <Text style={[styles.stepDesc, { color: textSecondary }]}>
                Used for personalized horoscope readings
            </Text>
            <View style={styles.genderRow}>
                {([
                    { key: 'female' as const, label: t('genderFemale'), Icon: FemaleIcon },
                    { key: 'male' as const, label: t('genderMale'), Icon: MaleIcon },
                    { key: 'other' as const, label: t('genderOther'), Icon: NonBinaryIcon },
                ]).map(({ key, label, Icon }) => {
                    const active = gender === key;
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.genderCard,
                                { backgroundColor: cardBg, borderColor: border },
                                active && styles.genderCardActive,
                            ]}
                            onPress={() => { setGender(key); Haptics.selectionAsync(); }}
                        >
                            <Icon color={active ? '#FFF' : textSecondary} />
                            <Text style={[styles.genderLabel, { color: active ? '#FFF' : textSecondary }]}>
                                {label}
                            </Text>
                            {active && (
                                <View style={styles.genderCheck}>
                                    <TickCircleIcon size={18} color="#FFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // ─── Step 3: Birth Date (NO outer ScrollView — standalone) ───────────

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: text }]}>{t('dateOfBirth')}</Text>
            <Text style={[styles.stepDesc, { color: textSecondary }]}>
                Essential for your birth chart calculation
            </Text>

            <View style={styles.drumRow}>
                <View style={styles.drumCol}>
                    <Text style={[styles.drumLabel, { color: textSecondary }]}>{t('dayLabel')}</Text>
                    <DrumPicker data={days} selectedIndex={selectedDay} onSelect={setSelectedDay} textSecondary={textSecondary} bg={bg} textColor={text} />
                </View>
                <View style={[styles.drumCol, { flex: 1.3 }]}>
                    <Text style={[styles.drumLabel, { color: textSecondary }]}>{t('monthLabel')}</Text>
                    <DrumPicker data={MONTHS} selectedIndex={selectedMonth} onSelect={setSelectedMonth} textSecondary={textSecondary} bg={bg} textColor={text} />
                </View>
                <View style={styles.drumCol}>
                    <Text style={[styles.drumLabel, { color: textSecondary }]}>{t('yearLabel')}</Text>
                    <DrumPicker data={years} selectedIndex={selectedYear} onSelect={setSelectedYear} textSecondary={textSecondary} bg={bg} textColor={text} />
                </View>
            </View>

            <TouchableOpacity
                style={[styles.timeToggle, { borderColor: border }]}
                onPress={() => {
                    setShowTimePicker(!showTimePicker);
                    if (!showTimePicker && selectedHour === null) { setSelectedHour(12); setSelectedMinute(0); }
                }}
            >
                <ClockIcon size={20} color={textSecondary} />
                <Text style={[styles.timeToggleText, { color: textSecondary }]}>
                    {showTimePicker
                        ? `${t('birthTime')}: ${String(selectedHour ?? 12).padStart(2, '0')}:${String(selectedMinute ?? 0).padStart(2, '0')}`
                        : t('addBirthTime')}
                </Text>
                <Ionicons name={showTimePicker ? 'chevron-up' : 'chevron-down'} size={18} color={textSecondary} />
            </TouchableOpacity>

            {showTimePicker && (
                <View style={[styles.drumRow, { height: PICKER_HEIGHT + 30, marginTop: 16 }]}>
                    <View style={styles.drumCol}>
                        <Text style={[styles.drumLabel, { color: textSecondary }]}>{t('hourLabel')}</Text>
                        <DrumPicker data={hours} selectedIndex={selectedHour ?? 12} onSelect={(i) => setSelectedHour(i)} textSecondary={textSecondary} bg={bg} textColor={text} />
                    </View>
                    <Text style={[styles.timeSeparator, { color: text }]}>:</Text>
                    <View style={styles.drumCol}>
                        <Text style={[styles.drumLabel, { color: textSecondary }]}>{t('minLabel')}</Text>
                        <DrumPicker data={minutes} selectedIndex={selectedMinute ?? 0} onSelect={(i) => setSelectedMinute(i)} textSecondary={textSecondary} bg={bg} textColor={text} />
                    </View>
                </View>
            )}
        </View>
    );

    // ─── Step 4: Birth Place + Summary ───────────────────────────────────

    const yearValue = currentYear - selectedYear;
    const dayValue = selectedDay + 1;
    const displayDate = `${MONTHS[selectedMonth]} ${dayValue}, ${yearValue}`;
    const displayTime = selectedHour !== null && selectedMinute !== null
        ? ` at ${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
        : '';

    const renderStep4 = () => (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.stepContainer}>
                <Text style={[styles.stepTitle, { color: text }]}>{t('placeOfBirth')}</Text>
                <Text style={[styles.stepDesc, { color: textSecondary }]}>
                    Location determines your rising sign
                </Text>

                {/* Country Selector */}
                <Text style={[styles.label, { color: text }]}>{t('country')}</Text>
                <TouchableOpacity
                    style={[styles.selectorBtn, { backgroundColor: inputBg, borderColor: border }]}
                    onPress={() => setShowCountryModal(true)}
                >
                    {selectedCountry ? (
                        <Text style={[styles.selectorText, { color: text }]}>
                            {selectedCountry.flag}  {selectedCountry.name}
                        </Text>
                    ) : (
                        <Text style={[styles.selectorText, { color: textSecondary }]}>{t('selectCountry')}</Text>
                    )}
                    <Ionicons name="chevron-down" size={20} color={textSecondary} />
                </TouchableOpacity>

                <View style={{ height: 20 }} />

                {/* City Selector */}
                <Text style={[styles.label, { color: text }]}>{t('cityLabel')}</Text>
                <TouchableOpacity
                    style={[styles.selectorBtn, { backgroundColor: inputBg, borderColor: border }, !selectedCountry && { opacity: 0.4 }]}
                    onPress={() => selectedCountry && setShowCityModal(true)}
                    disabled={!selectedCountry}
                >
                    <Text style={[styles.selectorText, { color: city ? text : textSecondary }]}>
                        {city || (selectedCountry ? 'Select city' : 'Select country first')}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={textSecondary} />
                </TouchableOpacity>

                {/* Summary Preview */}
                <View style={{ marginTop: 32 }}>
                    <Text style={[styles.summaryTitle, { color: text }]}>{t('summary')}</Text>
                    <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
                        <SummaryLine icon="person" label="Name" value={fullName} color={text} sub={textSecondary} />
                        <SummaryLine icon="male-female" label="Gender" value={gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '-'} color={text} sub={textSecondary} />
                        <SummaryLine icon="calendar" label="Birth Date" value={displayDate + displayTime} color={text} sub={textSecondary} />
                        <SummaryLine icon="location" label="Birth Place"
                            value={city ? `${city}, ${selectedCountry?.name || ''}` : (selectedCountry?.name || '-')}
                            color={text} sub={textSecondary} last />
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    // ─── Country/City Modals ─────────────────────────────────────────────

    const renderCountryModal = () => (
        <Modal visible={showCountryModal} animationType="slide" transparent>
            <View style={[styles.modalOverlay]}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: text }]}>{t('selectCountry')}</Text>
                        <TouchableOpacity onPress={() => { setShowCountryModal(false); setCountrySearch(''); }}>
                            <Ionicons name="close" size={24} color={textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.modalSearch, { backgroundColor: inputBg, color: text, borderColor: border }]}
                        placeholder={t('searchCountry')}
                        placeholderTextColor={textSecondary}
                        value={countrySearch}
                        onChangeText={setCountrySearch}
                        autoFocus
                    />
                    <FlatList
                        data={filteredCountries}
                        keyExtractor={(item) => item.name}
                        renderItem={({ item }) => {
                            const active = selectedCountry?.name === item.name;
                            return (
                                <TouchableOpacity
                                    style={[styles.modalItem, active && { backgroundColor: 'rgba(157,78,221,0.12)' }]}
                                    onPress={() => {
                                        setSelectedCountry(item);
                                        setCity('');
                                        setCountrySearch('');
                                        setShowCountryModal(false);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    <Text style={styles.modalItemFlag}>{item.flag}</Text>
                                    <Text style={[styles.modalItemText, { color: active ? '#9D4EDD' : text }]}>{item.name}</Text>
                                    {active && <Ionicons name="checkmark" size={20} color="#9D4EDD" />}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );

    const renderCityModal = () => (
        <Modal visible={showCityModal} animationType="slide" transparent>
            <View style={[styles.modalOverlay]}>
                <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: text }]}>
                            Select City {selectedCountry ? `(${selectedCountry.flag} ${selectedCountry.name})` : ''}
                        </Text>
                        <TouchableOpacity onPress={() => { setShowCityModal(false); setCitySearch(''); }}>
                            <Ionicons name="close" size={24} color={textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.modalSearch, { backgroundColor: inputBg, color: text, borderColor: border }]}
                        placeholder={t('searchCity')}
                        placeholderTextColor={textSecondary}
                        value={citySearch}
                        onChangeText={setCitySearch}
                        autoFocus
                    />
                    <FlatList
                        data={filteredCities}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => {
                            const active = city === item;
                            return (
                                <TouchableOpacity
                                    style={[styles.modalItem, active && { backgroundColor: 'rgba(157,78,221,0.12)' }]}
                                    onPress={() => {
                                        setCity(item);
                                        setCitySearch('');
                                        setShowCityModal(false);
                                        Haptics.selectionAsync();
                                    }}
                                >
                                    <Text style={[styles.modalItemText, { color: active ? '#9D4EDD' : text }]}>{item}</Text>
                                    {active && <Ionicons name="checkmark" size={20} color="#9D4EDD" />}
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={
                            <Text style={[styles.emptyText, { color: textSecondary }]}>{t('noCitiesFound')}</Text>
                        }
                    />
                </View>
            </View>
        </Modal>
    );

    // ─── Render ──────────────────────────────────────────────────────────

    // Steps 3 uses FlatList drums — don't wrap in ScrollView
    const needsScrollView = step !== 3;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                {/* Progress */}
                <View style={styles.progressHeader}>
                    <View style={styles.progressRow}>
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <View key={i} style={[styles.progressSegment, { backgroundColor: border }, i < step && { backgroundColor: '#9D4EDD' }]} />
                        ))}
                    </View>
                    <Text style={[styles.stepIndicator, { color: textSecondary }]}>{step} / {totalSteps}</Text>
                </View>

                {/* Content — no ScrollView for step 3 to avoid VirtualizedList nesting */}
                {needsScrollView ? (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 4 && renderStep4()}
                    </ScrollView>
                ) : (
                    <View style={styles.plainContent}>
                        {renderStep3()}
                    </View>
                )}

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: border, backgroundColor: bg }]}>
                    {step > 1 && (
                        <TouchableOpacity
                            style={[styles.backBtn, { backgroundColor: cardBg, borderColor: border }]}
                            onPress={handleBack}
                            disabled={isLoading}
                        >
                            <ArrowCircleLeftIcon size={24} color={text} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: '#9D4EDD', marginLeft: step > 1 ? 16 : 0 }]}
                        onPress={handleNext}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.nextBtnText}>{step === totalSteps ? t('saveAndStart') : t('continueButton')}</Text>
                                <Ionicons name={step === totalSteps ? 'checkmark' : 'arrow-forward'} size={20} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {renderCountryModal()}
            {renderCityModal()}
        </SafeAreaView>
    );
};

// ─── Summary Line Component ──────────────────────────────────────────────────

const SummaryLine = ({ icon, label, value, color, sub, last }: {
    icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string; sub: string; last?: boolean;
}) => (
    <View style={[styles.summaryLine, !last && styles.summaryLineBorder]}>
        <Ionicons name={icon} size={18} color="#9D4EDD" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
            <Text style={[{ fontSize: 11, color: sub }]}>{label}</Text>
            <Text style={[{ fontSize: 15, fontWeight: '600', color, marginTop: 2 }]}>{value || '-'}</Text>
        </View>
    </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    progressHeader: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 16 },
    progressRow: { flexDirection: 'row', gap: 6 },
    progressSegment: { flex: 1, height: 4, borderRadius: 2 },
    stepIndicator: { fontSize: 12, textAlign: 'right', marginTop: 8 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
    plainContent: { flex: 1, paddingHorizontal: 24 },
    stepContainer: { flex: 1 },
    stepTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    stepDesc: { fontSize: 15, marginBottom: 32, lineHeight: 22 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },

    // Big input
    bigInput: { height: 60, borderRadius: 16, paddingHorizontal: 20, fontSize: 18, borderWidth: 1.5 },

    // Gender
    genderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    genderCard: {
        flex: 1, height: 120, borderRadius: 20, borderWidth: 1.5,
        justifyContent: 'center', alignItems: 'center', gap: 8,
    },
    genderCardActive: { backgroundColor: '#9D4EDD', borderColor: '#9D4EDD' },
    genderLabel: { fontSize: 14, fontWeight: '600' },
    genderCheck: { position: 'absolute', top: 8, right: 8 },

    // Drum Picker
    drumRow: { flexDirection: 'row', gap: 10, height: PICKER_HEIGHT + 24 },
    drumCol: { flex: 1 },
    drumLabel: { textAlign: 'center', marginBottom: 6, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },

    // Time
    timeToggle: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', marginTop: 20,
    },
    timeToggleText: { flex: 1, fontSize: 14 },
    timeSeparator: { fontSize: 28, fontWeight: 'bold', alignSelf: 'center', marginTop: 20 },

    // Selector buttons (country/city)
    selectorBtn: {
        height: 56, borderRadius: 16, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1,
    },
    selectorText: { fontSize: 16 },

    // Summary
    summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    summaryCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    summaryLine: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    summaryLineBorder: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(150,150,150,0.15)' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 30 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    modalSearch: { height: 44, marginHorizontal: 20, borderRadius: 12, paddingHorizontal: 16, fontSize: 14, borderWidth: 1, marginBottom: 8 },
    modalItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
    modalItemFlag: { fontSize: 24 },
    modalItemText: { flex: 1, fontSize: 16 },
    emptyText: { textAlign: 'center', padding: 24, fontSize: 14 },

    // Footer
    footer: { flexDirection: 'row', padding: 24, borderTopWidth: 1, alignItems: 'center' },
    backBtn: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    nextBtn: {
        flex: 1, height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
        shadowColor: '#9D4EDD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
