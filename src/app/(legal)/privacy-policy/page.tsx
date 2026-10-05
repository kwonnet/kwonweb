import {pageMetadata} from '@/lib/seo';
import Link from "next/link";
import {Box, Typography} from "@mui/material";

export default function PrivacyPolicy() {
  return <Box component="article">
    <Typography component="h1" variant="h3" sx={{fontWeight: 700}}>Privacy Policy</Typography>
    <Typography color="text.secondary">Last updated: 5 October 2026</Typography>
    <p>This policy explains how Kwonnet collects, uses, and shares information when you browse our website or use our social networking, messaging, media, games, and wallet features. You can read this policy without creating an account.</p>
    <h2>1. Information we collect</h2>
    <ul><li>Account information you provide, such as your name, username, email address, profile image, banner, biography, country, and date of birth.</li>
    <li>Content and activity, including posts, replies, messages, uploaded media, follows, reactions, bookmarks, searches, game participation, and reports.</li>
    <li>Wallet and transaction records, including purchases, tips, rewards, subscriptions, balances, payment references, and transaction status. Payment providers may collect payment details directly.</li>
    <li>Technical information, such as IP address, approximate location derived from IP, browser/device information, device identifiers, connection events, and service logs.</li></ul>
    <h2>2. Google sign-in</h2>
    <p>If you choose Google sign-in, we receive basic account information such as your Google account identifier, verified email address, name, and profile image. We use it to authenticate you and create or connect your Kwonnet account. Google sign-in does not give Kwonnet your Google password, Gmail messages, contacts, or Google Drive files. We do not store a Google refresh token for this sign-in integration.</p>
    <h2>3. How we use information</h2>
    <p>We use information to operate accounts and features, personalize feeds and recommendations, identify topics and trends, process transactions, communicate service updates, investigate reports, prevent abuse and fraud, diagnose problems, and maintain the security and reliability of Kwonnet.</p>
    <p>Automated systems may analyze post content and interactions to recommend content or classify topics. Do not include confidential information in public posts. Depending on the feature and service configuration, external providers may process content to support these functions.</p>
    <h2>4. Visibility and sharing</h2>
    <p>Your public profile and public posts may be visible to visitors, other users, search engines, and people who receive shared links. Content shared with a restricted audience is handled according to the feature’s visibility settings. Recipients can copy or share content, so no audience setting can prevent every onward disclosure.</p>
    <p>We use service providers for hosting, databases, storage, video delivery, authentication, notifications, recommendations, and payments. These may include Google, Cloudflare, and Flutterwave, depending on the feature. We share information needed to deliver their services. We may also disclose information when required by law, to address fraud or security threats, or as part of a business transfer with appropriate safeguards.</p>
    <h2>5. Cookies and device storage</h2>
    <p>We use cookies and browser/device storage to maintain sign-in sessions, remember linked accounts and preferences, secure requests, and support service features. Signing out ends the active session; removing a saved account removes its device sign-in entry. Clearing browser storage can remove preferences and saved accounts. Blocking essential storage may prevent sign-in or other features from working.</p>
    <h2>6. Retention and security</h2>
    <p>We retain information for as long as needed to provide the service, maintain records, resolve disputes, prevent abuse, and meet applicable obligations. Transaction, fraud-prevention, and backup records may need to be kept after an account is closed. We use technical and organizational safeguards, but no service can guarantee absolute security.</p>
    <h2>7. Your choices and requests</h2>
    <p>You can edit available profile information, choose content visibility where supported, manage connected accounts and preferences, and use reporting or blocking features. To request access, correction, account deletion, or other privacy assistance, contact <a href="mailto:support@kwonnet.com">support@kwonnet.com</a>. We may ask for information to verify ownership before acting. Rights and exceptions depend on applicable law; some records must be retained.</p>
    <p>You may remove Kwonnet’s access from your Google account settings. This does not by itself delete your Kwonnet account or content; contact us separately for deletion assistance.</p>
    <h2>8. International processing and younger users</h2>
    <p>Kwonnet and its providers may process information in countries other than your own. Applicable protections and obligations may differ. You must meet the minimum age requirements that apply where you live; certain financial or reward features may have additional eligibility requirements. Contact us if you believe an account is being used contrary to applicable age restrictions.</p>
    <h2>9. Updates and contact</h2>
    <p>We may update this policy as features or requirements change. The date above identifies the latest version. For privacy questions, contact <a href="mailto:support@kwonnet.com">support@kwonnet.com</a>. See our <Link href="/terms-of-service">Terms of Service</Link> for the rules governing use of Kwonnet.</p>
  </Box>;
}

export const metadata = pageMetadata('Privacy Policy', 'How Kwonnet handles account information, content, Google sign-in, cookies, media and privacy requests.', '/privacy-policy', true);
