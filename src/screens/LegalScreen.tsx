// Privacy Policy & Terms of Service — bilingual, scrollable legal content.
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { ArrowCircleLeftIcon } from '../components/icons';
import { TouchableOpacity } from 'react-native';

type Section = { h: string; b: string };
type Doc = { title: string; updated: string; intro: string; sections: Section[] };

const CONTENT: Record<'privacy' | 'terms', Record<'tr' | 'en', Doc>> = {
  privacy: {
    tr: {
      title: 'Gizlilik Politikası',
      updated: 'Son güncelleme: Haziran 2026',
      intro: 'Kosmos Astro olarak gizliliğine değer veriyoruz. Bu politika, hangi verileri topladığımızı, nasıl kullandığımızı ve haklarını açıklar.',
      sections: [
        { h: '1. Topladığımız Veriler', b: 'Hesap bilgilerin (e-posta, kullanıcı adı, profil fotoğrafı), doğum bilgilerin (tarih, saat, yer — astrolojik hesaplamalar için), uygulama içi etkinliğin ve cihaz bilgileri.' },
        { h: '2. Verileri Nasıl Kullanırız', b: 'Kişiselleştirilmiş astrolojik yorumlar üretmek, hesabını yönetmek, hizmeti iyileştirmek ve sana bildirim göndermek için. Doğum verilerin yalnızca yorum üretiminde kullanılır.' },
        { h: '3. Yapay Zeka ve Üçüncü Taraflar', b: 'Yorumlar üretmek için yapay zeka servislerinden (ör. Google Gemini) yararlanırız; gönderilen istemler kişisel kimlik bilgisi içermez. Ödeme işlemleri ilgili mağaza (App Store / Google Play) üzerinden yürütülür.' },
        { h: '4. Veri Saklama ve Güvenlik', b: 'Verilerin şifreli bağlantılar üzerinden iletilir ve güvenli sunucularda saklanır. Oturum anahtarların cihazında güvenli depoda tutulur.' },
        { h: '5. Haklarına', b: 'Verilerine erişebilir, düzeltebilir veya hesabını silerek tüm verilerinin kaldırılmasını talep edebilirsin. Talepler için bize ulaşabilirsin.' },
        { h: '6. Çocukların Gizliliği', b: 'Kosmos Astro 13 yaş altı kullanıcılara yönelik değildir ve bilerek bu yaş grubundan veri toplamayız.' },
        { h: '7. İletişim', b: 'Sorularını support@kosmosastro.app adresine iletebilirsin.' },
      ],
    },
    en: {
      title: 'Privacy Policy',
      updated: 'Last updated: June 2026',
      intro: 'At Kosmos Astro we value your privacy. This policy explains what data we collect, how we use it, and your rights.',
      sections: [
        { h: '1. Data We Collect', b: 'Account details (email, username, profile photo), birth information (date, time, place — for astrological calculations), in-app activity, and device information.' },
        { h: '2. How We Use Data', b: 'To generate personalised astrological readings, manage your account, improve the service, and send you notifications. Your birth data is used solely to produce readings.' },
        { h: '3. AI and Third Parties', b: 'We use AI services (e.g. Google Gemini) to generate readings; prompts sent do not include identifying personal data. Payments are processed by the relevant store (App Store / Google Play).' },
        { h: '4. Storage and Security', b: 'Your data is transmitted over encrypted connections and stored on secure servers. Session tokens are kept in your device’s secure store.' },
        { h: '5. Your Rights', b: 'You may access, correct, or request deletion of your data by deleting your account. Contact us for any request.' },
        { h: '6. Children’s Privacy', b: 'Kosmos Astro is not directed to users under 13 and we do not knowingly collect data from them.' },
        { h: '7. Contact', b: 'Reach us at support@kosmosastro.app for any questions.' },
      ],
    },
  },
  terms: {
    tr: {
      title: 'Kullanım Şartları',
      updated: 'Son güncelleme: Haziran 2026',
      intro: 'Kosmos Astro’yu kullanarak aşağıdaki şartları kabul etmiş olursun.',
      sections: [
        { h: '1. Hizmetin Kabulü', b: 'Uygulamayı kullanman bu şartları kabul ettiğin anlamına gelir. Kabul etmiyorsan lütfen uygulamayı kullanma.' },
        { h: '2. Hizmet Tanımı', b: 'Kosmos Astro astroloji, tarot ve benzeri içerikler sunar. Tüm içerikler eğlence ve kişisel gelişim amaçlıdır; profesyonel tıbbi, hukuki veya finansal tavsiye yerine geçmez.' },
        { h: '3. Hesap', b: 'Hesap bilgilerinin gizliliğinden sen sorumlusun. Doğru bilgi vermeyi ve hesabını kötüye kullanmamayı kabul edersin.' },
        { h: '4. Jetonlar ve Satın Almalar', b: '“Ay Taşı” jetonları uygulama içi özellikler için kullanılır. Satın almalar ilgili mağaza politikalarına tabidir; tüketilen sanal ürünler genellikle iade edilemez.' },
        { h: '5. Kabul Edilebilir Kullanım', b: 'Hizmeti yasa dışı amaçlarla, başkalarını taciz etmek veya sistemleri kötüye kullanmak için kullanamazsın.' },
        { h: '6. Sorumluluk Reddi', b: 'İçerikler “olduğu gibi” sunulur. Astrolojik yorumlara dayanarak aldığın kararlardan Kosmos Astro sorumlu tutulamaz.' },
        { h: '7. Fikri Mülkiyet', b: 'Uygulamadaki tüm içerik ve markalar Kosmos Astro’ya aittir ve izinsiz kullanılamaz.' },
        { h: '8. Fesih', b: 'Şartları ihlal etmen hâlinde hesabını askıya alabilir veya kapatabiliriz.' },
        { h: '9. Değişiklikler', b: 'Bu şartları zaman zaman güncelleyebiliriz. Güncel sürüm uygulamada yayımlanır.' },
        { h: '10. İletişim', b: 'support@kosmosastro.app üzerinden bize ulaşabilirsin.' },
      ],
    },
    en: {
      title: 'Terms of Service',
      updated: 'Last updated: June 2026',
      intro: 'By using Kosmos Astro you agree to the following terms.',
      sections: [
        { h: '1. Acceptance', b: 'Using the app means you accept these terms. If you do not agree, please do not use the app.' },
        { h: '2. Service Description', b: 'Kosmos Astro provides astrology, tarot and related content. All content is for entertainment and personal-growth purposes and is not a substitute for professional medical, legal or financial advice.' },
        { h: '3. Account', b: 'You are responsible for keeping your account credentials confidential. You agree to provide accurate information and not misuse your account.' },
        { h: '4. Tokens and Purchases', b: '“Moonstone” tokens are used for in-app features. Purchases are subject to the relevant store policies; consumed virtual goods are generally non-refundable.' },
        { h: '5. Acceptable Use', b: 'You may not use the service for unlawful purposes, to harass others, or to abuse our systems.' },
        { h: '6. Disclaimer', b: 'Content is provided “as is”. Kosmos Astro is not liable for decisions you make based on astrological readings.' },
        { h: '7. Intellectual Property', b: 'All content and trademarks in the app belong to Kosmos Astro and may not be used without permission.' },
        { h: '8. Termination', b: 'We may suspend or close your account if you violate these terms.' },
        { h: '9. Changes', b: 'We may update these terms from time to time. The current version is published in the app.' },
        { h: '10. Contact', b: 'Reach us at support@kosmosastro.app.' },
      ],
    },
  },
};

export const LegalScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ui, isDark } = useTheme();
  const { language } = useTranslation();
  const type: 'privacy' | 'terms' = route.params?.type === 'terms' ? 'terms' : 'privacy';
  const lang = language === 'tr' ? 'tr' : 'en';
  const doc = CONTENT[type][lang];

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? 'transparent' : '#FAFAFA' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F0F0F0' }]}>
            <ArrowCircleLeftIcon size={24} color={ui.textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: ui.textColor }]} numberOfLines={1}>{doc.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.updated, { color: ui.subTextColor }]}>{doc.updated}</Text>
          <Text style={[styles.intro, { color: ui.textColor }]}>{doc.intro}</Text>
          {doc.sections.map((s, i) => (
            <View key={i} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: ui.textColor }]}>{s.h}</Text>
              <Text style={[styles.sectionBody, { color: ui.subTextColor }]}>{s.b}</Text>
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  updated: { fontSize: 12, marginBottom: 12 },
  intro: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  sectionBody: { fontSize: 14, lineHeight: 21 },
});
