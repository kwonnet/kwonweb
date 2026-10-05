import {pageMetadata} from '@/lib/seo';
import Link from "next/link";
import {Box, Typography} from "@mui/material";

export default function TermsOfService() {
  return <Box component="article">
    <Typography component="h1" variant="h3" sx={{fontWeight: 700}}>Terms of Service</Typography>
    <Typography color="text.secondary">Last updated: 5 October 2026</Typography>
    <p>These terms govern your use of Kwonnet, including browsing public pages and using accounts, posts, messaging, media, games, subscriptions, wallets, and tips. By using the service, you agree to these terms and any additional conditions displayed for a particular feature.</p>
    <h2>1. Eligibility and accounts</h2>
    <p>You must meet applicable age requirements and be legally permitted to use the features you access. Provide accurate account information, keep your credentials secure, and do not impersonate another person or access an account without permission. You are responsible for activity you authorize through your account. Contact us promptly if you suspect unauthorized access.</p>
    <h2>2. Acceptable use</h2>
    <p>Do not use Kwonnet for unlawful activity, harassment, threats, hate, exploitation, scams, deceptive impersonation, infringement, spam, or distribution of malware. Do not bypass security, manipulate engagement or rewards, interfere with the service, scrape private information, or exploit bugs. Report suspected abuse through the available reporting features or our support address.</p>
    <h2>3. Your content</h2>
    <p>You retain the rights you hold in your content. You must have permission to post or upload it and must respect other people’s privacy and intellectual property. You grant Kwonnet a non-exclusive license to host, store, reproduce, process, display, and distribute your content as needed to operate the service, consistent with your selected audience and these terms.</p>
    <p>This includes technical processing for media delivery, search, topic classification, recommendations, and moderation. Removing content generally ends its availability through your account, subject to shared copies, backups, transaction records, and legitimate retention needs.</p>
    <h2>4. Public content and communications</h2>
    <p>Public content can be seen or shared outside Kwonnet. Use care when posting personal or confidential information. You are responsible for how you interact with other users. Kwonnet does not endorse every post, message, link, recommendation, or statement made by a user.</p>
    <h2>5. Coins, tips, payments, and subscriptions</h2>
    <p>Review the price, currency, fees, eligibility, settlement timing, and other conditions shown before confirming a transaction. Virtual coins and credits are service features; they are not bank deposits or a promise of investment returns. Purchasing a feature or sending a tip does not guarantee earnings, eligibility for a payout, or a particular outcome.</p>
    <p>Tips, rewards, and payouts can have fees, conversion rules, holding periods, verification requirements, and adjustments for fraud, refunds, or errors. A gross tip value is not necessarily the amount credited to a recipient’s withdrawable balance. Payment providers may apply their own terms. Subscription billing and cancellation conditions are described in the applicable purchase flow.</p>
    <p>Contact support about failed, duplicate, or disputed transactions before retrying repeatedly. Refunds and cancellations are assessed under the applicable purchase conditions and mandatory law. Nothing in these terms removes statutory consumer rights.</p>
    <h2>6. Games and rewards</h2>
    <p>Game participation and rewards are subject to the rules and eligibility conditions displayed for the relevant game. Do not cheat, use unauthorized automation, collude, or manipulate results. Rewards are not guaranteed merely by participating, and access may be restricted where a feature is prohibited by law.</p>
    <h2>7. Moderation and account restrictions</h2>
    <p>We may investigate reports and restrict or remove content, features, or accounts for violations, fraud, security issues, or legal requirements. We may preserve relevant records and withhold disputed rewards where appropriate. Contact support if you believe a restriction or action is an error.</p>
    <h2>8. Third-party services and availability</h2>
    <p>Kwonnet uses third-party services for authentication, hosting, media, payments, and other functionality. Their terms may apply to your direct use of those services. We may change or discontinue features and cannot promise uninterrupted service, error-free operation, or a specific recommendation or game result.</p>
    <h2>9. Responsibility and limitations</h2>
    <p>To the extent permitted by applicable law, the service is provided as available, and we do not make guarantees about user-generated content or third-party services. We are not responsible for losses caused by your unauthorized sharing of credentials, unlawful use, or third-party conduct beyond our control. Any limitation is subject to mandatory protections and does not exclude liability that the law does not allow us to exclude.</p>
    <h2>10. Closing an account and changes</h2>
    <p>You may stop using Kwonnet and request account closure by contacting support. Some content or records may remain for legal, security, transaction, or backup purposes, as explained in our <Link href="/privacy-policy">Privacy Policy</Link>. We may update these terms and will identify the latest version using the date above. Material changes will be communicated where required.</p>
    <h2>11. Contact and resolving concerns</h2>
    <p>For account, content, payment, or terms questions, contact <a href="mailto:support@kwonnet.com">support@kwonnet.com</a> with enough detail to investigate, without sending passwords or full payment-card details. We encourage you to contact us first to resolve concerns. Applicable law and mandatory consumer protections continue to apply.</p>
  </Box>;
}

export const metadata = pageMetadata('Terms of Service', 'Terms for browsing Kwonnet and using accounts, posts, media, games, subscriptions, wallets and tips.', '/terms-of-service', true);
