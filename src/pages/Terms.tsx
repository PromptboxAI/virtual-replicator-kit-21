import { Helmet } from "react-helmet-async";

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service | Promptbox</title>
        <meta
          name="description"
          content="Promptbox Terms of Service - Read our terms and conditions for using the tokenized AI agent launchpad platform."
        />
        <link rel="canonical" href="https://promptbox.com/terms" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <article className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Promptbox – Terms of Service
            </h1>
            <p className="text-muted-foreground text-sm mb-8 italic">
              Last updated: December 8, 2025
            </p>

            <p className="text-foreground/90 leading-relaxed mb-4">
              These Terms of Service (the "<strong>Terms</strong>") govern your
              access to and use of:
            </p>

            <ul className="list-disc pl-6 mb-6 text-foreground/90 space-y-2">
              <li>
                The Promptbox website at <strong>promptbox.com</strong> and any
                related subdomains (the "<strong>Site</strong>"), and
              </li>
              <li>
                The products, applications, tools, dashboards, APIs, and other
                services we make available (collectively, the "
                <strong>Services</strong>").
              </li>
            </ul>

            <p className="text-foreground/90 leading-relaxed mb-4">
              In these Terms:
            </p>

            <ul className="list-disc pl-6 mb-6 text-foreground/90 space-y-2">
              <li>
                "<strong>Promptbox</strong>", "<strong>we</strong>", "
                <strong>us</strong>", or "<strong>our</strong>" refers to
                Promptbox and its affiliates.
              </li>
              <li>
                "<strong>You</strong>" or "<strong>your</strong>" means the
                person or entity accessing or using the Services.
              </li>
              <li>
                If you sign up on behalf of a company or other entity, "you"
                includes that entity and you represent that you are authorized
                to bind that entity to these Terms.
              </li>
            </ul>

            <p className="text-foreground/90 leading-relaxed mb-8">
              By accessing or using the Site or Services, you agree to be bound
              by these Terms. If you do not agree, do not use the Site or
              Services.
            </p>

            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Changes to These Terms
              </h2>
              <p className="text-foreground/90 mb-4">
                We may update these Terms from time to time. If we make material
                changes, we will post the updated Terms on the Site and may also
                notify you by email or in-product notice. The "Last updated"
                date above will reflect the latest version.
              </p>
              <p className="text-foreground/90">
                Your continued use of the Services after the updated Terms
                become effective means you accept the revised Terms.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. Description of the Services
              </h2>
              <p className="text-foreground/90 mb-4">
                Promptbox is a tokenized AI agent launchpad and platform. In
                general, the Services may allow you to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>Create and configure AI agents and workflows;</li>
                <li>
                  Deploy agents through interfaces, dashboards, and
                  integrations;
                </li>
                <li>
                  Create or interact with tokens and bonding-curve–style
                  mechanics on supported blockchains (e.g., Base and other
                  networks we may support);
                </li>
                <li>
                  Connect wallets, trade via third-party protocols, and view
                  analytics such as token price, market cap, volume, holders,
                  and usage;
                </li>
                <li>
                  Access other tools we may add over time (e.g., template
                  libraries, "brains" or knowledge bases, social and governance
                  features).
                </li>
              </ul>
              <p className="text-foreground/90 mb-4">
                We may update, change, or discontinue any part of the Services
                at any time, with or without notice, subject to applicable law.
              </p>
              <p className="text-foreground/90">
                We do <strong>not</strong> operate a centralized exchange,
                brokerage, or investment advisory service. Trades, liquidity
                provisioning, and token transfers are executed on third-party
                protocols and blockchains that we do not control. You use these
                at your own risk.
              </p>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. Eligibility
              </h2>
              <p className="text-foreground/90 mb-4">
                You may use the Services only if:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  You are at least 18 years old (or the age of legal majority
                  where you live, if higher);
                </li>
                <li>You can form a binding contract with Promptbox; and</li>
                <li>
                  You are not prohibited from using the Services under any
                  applicable laws, sanctions, or export controls.
                </li>
              </ul>
              <p className="text-foreground/90">
                By using the Services, you represent and warrant that you meet
                these requirements.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. Your Account
              </h2>
              <p className="text-foreground/90 mb-4">
                To access certain features, you may need to create an account ("
                <strong>Account</strong>").
              </p>
              <p className="text-foreground/90 mb-2">You agree to:</p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Provide accurate and complete registration information and
                  keep it up to date;
                </li>
                <li>
                  Maintain the confidentiality of your login credentials;
                </li>
                <li>
                  Immediately notify us if you believe your account has been
                  compromised; and
                </li>
                <li>
                  Be responsible for all activities that occur under your
                  Account.
                </li>
              </ul>
              <p className="text-foreground/90 mb-4">
                If you share your credentials or allow others to access your
                Account, you are responsible for their actions and any resulting
                consequences.
              </p>
              <p className="text-foreground/90">
                We reserve the right to suspend or terminate your Account if we
                reasonably believe you have violated these Terms or that your
                use of the Services may harm Promptbox, other users, or third
                parties.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Wallets, Tokens, and Blockchain Activity
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.1 Wallets
              </h3>
              <p className="text-foreground/90 mb-4">
                The Services may allow you to connect an existing blockchain
                wallet or have a wallet automatically created for you via a
                third-party wallet provider.
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  You remain solely responsible for maintaining the security of
                  your wallet, private keys, seed phrases, and any associated
                  credentials.
                </li>
                <li>
                  Promptbox does <strong>not</strong> store your private keys
                  and cannot recover them if lost.
                </li>
                <li>
                  Any blockchain transaction is irreversible once confirmed on
                  the underlying network.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.2 Tokens and Bonding Curves
              </h3>
              <p className="text-foreground/90 mb-2">
                The Services may enable you to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Create tokens and on-chain positions (e.g., bonding-curve
                  launches, liquidity positions) on supported networks;
                </li>
                <li>
                  Purchase, sell, or otherwise interact with tokens, including
                  the Promptbox-native $PROMPT token and other tokens associated
                  with AI agents.
                </li>
              </ul>
              <p className="text-foreground/90 mb-2">
                You understand and agree that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  All tokens are highly volatile and involve a high degree of
                  risk, including the possible loss of all value;
                </li>
                <li>
                  Past performance of any token, agent, or strategy does not
                  guarantee future results;
                </li>
                <li>
                  Promptbox does not guarantee any token's price, liquidity,
                  market cap, or success;
                </li>
                <li>
                  On-chain data (including your transactions, balances, and
                  positions) is public and outside of Promptbox's control.
                </li>
              </ul>
              <p className="text-foreground/90">
                You are solely responsible for understanding and complying with
                any laws, regulations, and tax obligations that apply to your
                use of tokens, cryptoassets, or DeFi protocols. Promptbox does
                not provide legal, tax, accounting, or investment advice.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Prohibited Uses
              </h2>
              <p className="text-foreground/90 mb-4">
                You agree not to, and will not permit any third party to:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                1. Misuse the Services
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Circumvent or manipulate any fee, billing, or usage structure;
                </li>
                <li>
                  Access any systems or data not intended for you, or attempt to
                  bypass authentication or security controls;
                </li>
                <li>
                  Interfere with or disrupt the operation of the Services or
                  impose an unreasonable load on our infrastructure.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                2. Misuse Intellectual Property
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Copy, modify, adapt, translate, reverse engineer, decompile,
                  or disassemble any portion of the Services except as permitted
                  by law;
                </li>
                <li>
                  Frame or mirror any part of the Site or use our trademarks,
                  logos, or branding without our prior written consent.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3. Upload Certain Types of Data
              </h3>
              <p className="text-foreground/90 mb-2">
                You must not upload or use the Services to process:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Protected health information regulated by HIPAA or similar
                  laws;
                </li>
                <li>Payment card data governed by PCI-DSS;</li>
                <li>
                  "Nonpublic personal information" under the Gramm-Leach-Bliley
                  Act;
                </li>
                <li>
                  Any other highly sensitive personal data (such as government
                  IDs, social security numbers, or biometric identifiers) unless
                  specifically permitted in a separate written agreement.
                </li>
              </ul>
              <p className="text-foreground/90 mb-4 text-sm italic">
                Promptbox disclaims any liability for processing such prohibited
                data.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4. Illegal or High-Risk Activities
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Use the Services for any unlawful, fraudulent, or abusive
                  purpose;
                </li>
                <li>
                  Use the Services in connection with money laundering, terrorist
                  financing, sanctions evasion, or other illicit activity;
                </li>
                <li>
                  Use the Services for high-risk activities where failure could
                  lead to death, personal injury, or severe environmental damage
                  (e.g., life-critical medical systems, nuclear facilities, air
                  traffic control).
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5. Violations of Rights
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Upload or transmit content that infringes or misappropriates a
                  third party's intellectual property or other rights;
                </li>
                <li>
                  Impersonate any person or entity, or misrepresent your
                  affiliation with any person or entity.
                </li>
              </ul>
              <p className="text-foreground/90">
                We may investigate and take appropriate action (including
                account suspension or termination) if we reasonably believe you
                have violated this section or applicable law.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. Intellectual Property
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.1 Promptbox IP
              </h3>
              <p className="text-foreground/90 mb-4">
                The Site, Services, software, documentation, designs, logos,
                trademarks, and all related content and technology are owned by
                Promptbox or its licensors and are protected by copyright,
                trademark, and other intellectual-property laws.
              </p>
              <p className="text-foreground/90 mb-4">
                Except as expressly allowed in these Terms, you obtain no rights
                in any Promptbox IP. We grant you a limited, revocable,
                non-exclusive, non-transferable, non-sublicensable license to
                access and use the Services solely for your internal business or
                personal purposes, subject to these Terms and any plan-specific
                limits.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.2 Your Content and Customer Data
              </h3>
              <p className="text-foreground/90 mb-4">
                "<strong>Customer Data</strong>" means all non-public
                information, prompts, files, workflows, agent configurations,
                and other data you provide or make available to Promptbox
                through the Services.
              </p>
              <p className="text-foreground/90 mb-2">
                Subject to these Terms:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>You retain ownership of your Customer Data.</li>
                <li>
                  You grant Promptbox a worldwide, non-exclusive, royalty-free
                  license to host, store, process, display, and otherwise use
                  your Customer Data as reasonably necessary to provide,
                  maintain, secure, and improve the Services.
                </li>
              </ul>
              <p className="text-foreground/90 mb-2">
                You are solely responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  The accuracy, quality, legality, and appropriateness of your
                  Customer Data;
                </li>
                <li>
                  Ensuring you have all rights needed to grant the license
                  above;
                </li>
                <li>
                  Ensuring your use of Customer Data (including any personal
                  data or third-party data) complies with applicable law.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.3 Aggregated and De-Identified Data
              </h3>
              <p className="text-foreground/90 mb-2">
                We may collect and analyze data relating to the use and
                performance of the Services (including data derived from
                Customer Data) and may:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Use such data to improve, operate, and develop the Services
                  and other offerings; and
                </li>
                <li>
                  Disclose such data in aggregated or de-identified form that
                  does not identify you or any individual.
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. AI Models, Integrations, and Third-Party Services
              </h2>
              <p className="text-foreground/90 mb-4">
                The Services integrate with or rely on third-party AI models,
                APIs, wallets, trading protocols, analytics tools, and other
                services ("<strong>Third-Party Services</strong>").
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  When you choose to use a given model or integration, relevant
                  data (including prompts, inputs, and context) may be sent to
                  that provider so they can perform the requested action.
                </li>
                <li>
                  Third-Party Services are governed by their own terms and
                  privacy policies. Promptbox does not control and is not
                  responsible for their content, security, or data handling.
                </li>
              </ul>
              <p className="text-foreground/90 mb-4">
                We make no guarantees about the accuracy, reliability, or
                availability of outputs generated by AI models or Third-Party
                Services.
              </p>
              <p className="text-foreground/90">
                Your use of Third-Party Services is at your own risk. Any
                dispute between you and a third-party provider is solely between
                you and that provider.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. Ordering, Subscriptions, and Fees
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                9.1 Plans and Orders
              </h3>
              <p className="text-foreground/90 mb-4">
                You may purchase access to certain features via subscriptions,
                usage-based fees, or other plans described on our pricing page
                or in a written order ("<strong>Order</strong>").
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  By placing an Order, you agree to pay the applicable fees and
                  to any plan-specific limitations (e.g., agent count, usage
                  caps, or feature access).
                </li>
                <li>
                  We have no obligation to provide Services related to any Order
                  for which payment has not been successfully completed.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                9.2 Payments and Taxes
              </h3>
              <p className="text-foreground/90 mb-2">
                Unless otherwise stated in an Order:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Fees are due at the time of purchase or in accordance with the
                  billing schedule shown;
                </li>
                <li>
                  All fees are non-cancellable and non-refundable, except where
                  required by law or expressly stated otherwise;
                </li>
                <li>
                  Prices are exclusive of taxes, duties, and similar charges,
                  which you are responsible for paying.
                </li>
              </ul>
              <p className="text-foreground/90 mb-4">
                We may charge interest on overdue amounts and recover collection
                costs where permitted by law.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                9.3 On-Chain Fees
              </h3>
              <p className="text-foreground/90 mb-4">
                Use of blockchains and DeFi protocols may incur network fees
                (e.g., gas), protocol fees, DEX fees, or other on-chain costs.
                These are not controlled by Promptbox.
              </p>
              <p className="text-foreground/90 mb-2">
                You are solely responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Ensuring you have sufficient balance to cover these fees;
                </li>
                <li>
                  Any loss or failure resulting from insufficient funds,
                  slippage, or protocol behavior.
                </li>
              </ul>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Data Protection and Privacy
              </h2>
              <p className="text-foreground/90 mb-4">
                Your use of the Services is also governed by the{" "}
                <strong>Promptbox Privacy Policy</strong>, which describes how
                we collect, use, and protect personal information. By using the
                Services, you consent to our data practices as described in the
                Privacy Policy.
              </p>
              <p className="text-foreground/90">
                We do not use Customer Data to train third-party models for
                their own product improvement and do not sell your Customer
                Data. We may configure providers so that data is used only to
                provide the requested inference or service, subject to their
                terms.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                11. Security
              </h2>
              <p className="text-foreground/90 mb-4">
                We implement commercially reasonable administrative, technical,
                and physical safeguards designed to protect information we
                process against unauthorized access, use, or disclosure.
              </p>
              <p className="text-foreground/90 mb-2">However:</p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  No method of transmission or storage is completely secure;
                </li>
                <li>
                  We cannot guarantee absolute security of the Services or any
                  data; and
                </li>
                <li>
                  You are responsible for configuring and maintaining your own
                  infrastructure (devices, networks, security controls, backups,
                  etc.).
                </li>
              </ul>
              <p className="text-foreground/90">
                Promptbox is not liable for unauthorized access, corruption, or
                loss of your data except to the extent caused directly by our
                gross negligence or willful misconduct, and subject to the
                limitations of liability below.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                12. Term and Termination
              </h2>
              <p className="text-foreground/90 mb-4">
                These Terms are effective from the date you first accept them or
                first use the Services (whichever occurs earlier) and continue
                until terminated.
              </p>
              <p className="text-foreground/90 mb-2">
                We may suspend or terminate your access to the Services (in
                whole or in part), including specific subscriptions or features,
                if:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  You materially breach these Terms and fail to cure the breach
                  within a reasonable period (if curable);
                </li>
                <li>
                  We reasonably believe your use of the Services is unlawful,
                  unsafe, or poses a risk to us, other users, or the integrity
                  of the Services; or
                </li>
                <li>Required by law or by a competent authority.</li>
              </ul>
              <p className="text-foreground/90 mb-4">
                You may cancel your account or subscription as described in your
                Account settings or in your Order, or by contacting us.
              </p>
              <p className="text-foreground/90 mb-2">Upon termination:</p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Your right to access and use the Services will cease;
                </li>
                <li>
                  All fees owed by you will become immediately due and payable
                  (unless otherwise stated in a written agreement);
                </li>
                <li>
                  Certain sections of these Terms, by their nature, will survive
                  (including ownership, payment obligations, disclaimers,
                  indemnity, and limitations of liability).
                </li>
              </ul>
            </section>

            {/* Section 13 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                13. Disclaimers
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                13.1 General
              </h3>
              <p className="text-foreground/90 mb-4">
                Except as expressly stated in a separate written agreement, the
                Site and Services are provided on an "<strong>as is</strong>"
                and "<strong>as available</strong>" basis, without warranties of
                any kind, whether express, implied, or statutory, including
                implied warranties of merchantability, fitness for a particular
                purpose, non-infringement, and any warranties arising out of
                course of dealing or usage of trade.
              </p>
              <p className="text-foreground/90 mb-2">
                We do not warrant that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  The Services will be uninterrupted, secure, or error-free;
                </li>
                <li>Any defects will be corrected; or</li>
                <li>
                  Outputs from AI models, analytics, or dashboards will be
                  accurate, complete, or reliable.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                13.2 AI Output and Automation
              </h3>
              <p className="text-foreground/90 mb-4">
                Any content generated by AI agents, models, or workflows through
                Promptbox is <strong>machine-generated</strong> and may be
                incomplete, incorrect, biased, or unsafe.
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  You are solely responsible for reviewing, validating, and
                  using AI outputs;
                </li>
                <li>
                  You should not rely on AI outputs as a substitute for
                  professional advice (legal, tax, financial, medical, or
                  otherwise);
                </li>
                <li>
                  You are responsible for how you or your end users act on any
                  AI outputs or automation triggered by your agents.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                13.3 No Investment, Legal, or Tax Advice
              </h3>
              <p className="text-foreground/90 mb-2">
                Nothing in the Services constitutes:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Investment advice or a recommendation to buy, sell, or hold
                  any token, security, or asset;
                </li>
                <li>Legal or tax advice; or</li>
                <li>
                  A guarantee of any financial outcome or token performance.
                </li>
              </ul>
              <p className="text-foreground/90">
                You should consult your own professional advisors before making
                any financial, legal, or tax decisions.
              </p>
            </section>

            {/* Section 14 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                14. Indemnity
              </h2>
              <p className="text-foreground/90 mb-2">
                You agree to defend, indemnify, and hold harmless Promptbox, its
                affiliates, and their respective officers, directors, employees,
                and agents from and against any claims, damages, losses,
                liabilities, costs, and expenses (including reasonable
                attorneys' fees) arising out of or related to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>Your use of or access to the Site or Services;</li>
                <li>Your violation of these Terms;</li>
                <li>
                  Your violation of any third-party rights (including
                  intellectual-property or privacy rights);
                </li>
                <li>
                  Any content or data you submit, upload, or make available
                  through the Services;
                </li>
                <li>
                  Any token, agent, strategy, or automation you create or deploy
                  using the Services.
                </li>
              </ul>
              <p className="text-foreground/90">
                This obligation will survive termination of these Terms and your
                use of the Services.
              </p>
            </section>

            {/* Section 15 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                15. Limitation of Liability
              </h2>
              <p className="text-foreground/90 mb-4">
                To the maximum extent permitted by law:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                1. No Indirect Damages
              </h3>
              <p className="text-foreground/90 mb-4">
                Promptbox will not be liable for any indirect, incidental,
                special, consequential, exemplary, or punitive damages, or for
                any loss of profits, revenue, data, or goodwill, arising out of
                or related to the Services or these Terms, even if advised of
                the possibility of such damages.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                2. Cap on Direct Damages
              </h3>
              <p className="text-foreground/90 mb-2">
                Promptbox's total aggregate liability arising out of or related
                to the Services and these Terms will not exceed the greater of:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  The amounts you actually paid to Promptbox for the Services
                  giving rise to the claim during the six (6) months immediately
                  preceding the event giving rise to the claim; or
                </li>
                <li>
                  One hundred U.S. dollars (US $100) if you have not paid
                  Promptbox for the Services.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3. Applicability
              </h3>
              <p className="text-foreground/90 mb-4">
                These limitations apply to all causes of action, whether in
                contract, tort (including negligence), strict liability, or
                otherwise, and regardless of the theory of liability.
              </p>
              <p className="text-foreground/90 text-sm italic">
                Some jurisdictions do not allow certain disclaimers or
                limitations of liability, so some of the above may not apply to
                you to the extent prohibited by law.
              </p>
            </section>

            {/* Section 16 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                16. Export and Sanctions
              </h2>
              <p className="text-foreground/90 mb-4">
                You agree to comply with all applicable export, import, and
                sanctions laws and regulations, including those administered by
                the U.S. Department of Commerce and the U.S. Department of the
                Treasury.
              </p>
              <p className="text-foreground/90 mb-2">
                You represent that you are not:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  Located in, under the control of, or a national or resident of
                  any country or territory subject to comprehensive U.S.
                  sanctions; or
                </li>
                <li>
                  A person on any U.S. government restricted party list.
                </li>
              </ul>
              <p className="text-foreground/90">
                You may not use the Services if any of the above apply to you.
              </p>
            </section>

            {/* Section 17 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                17. Governing Law and Dispute Resolution
              </h2>
              <p className="text-foreground/90 mb-4">
                These Terms and any dispute arising out of or relating to them
                or the Services will be governed by and construed in accordance
                with the laws of the State of <strong>Delaware</strong>, without
                regard to its conflict-of-laws rules.
              </p>
              <p className="text-foreground/90">
                You agree that the state and federal courts located in Delaware
                will have exclusive jurisdiction over any such disputes, and you
                consent to personal jurisdiction and venue in those courts.
              </p>
            </section>

            {/* Section 18 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                18. Miscellaneous
              </h2>
              <ul className="space-y-3 text-foreground/90">
                <li>
                  <strong className="text-foreground">
                    Entire Agreement.
                  </strong>{" "}
                  These Terms, together with any applicable Orders and our
                  Privacy Policy, form the entire agreement between you and
                  Promptbox regarding the Services and supersede any prior or
                  contemporaneous agreements.
                </li>
                <li>
                  <strong className="text-foreground">Assignment.</strong> You
                  may not assign or transfer these Terms without our prior
                  written consent. We may assign or transfer these Terms without
                  restriction.
                </li>
                <li>
                  <strong className="text-foreground">Notices.</strong> We may
                  provide notices by email, posting on the Site, or any other
                  method reasonably designed to reach you.
                </li>
                <li>
                  <strong className="text-foreground">Waiver.</strong> Our
                  failure to enforce any provision of these Terms is not a
                  waiver of our right to enforce it later.
                </li>
                <li>
                  <strong className="text-foreground">Severability.</strong> If
                  any provision of these Terms is held invalid or unenforceable,
                  the remaining provisions will remain in full force and effect.
                </li>
                <li>
                  <strong className="text-foreground">Force Majeure.</strong>{" "}
                  Neither party will be liable for failure or delay in
                  performance due to events beyond its reasonable control (such
                  as natural disasters, war, terrorism, labor disputes, or
                  internet outages).
                </li>
              </ul>
            </section>

            {/* Section 19 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                19. Contact Us
              </h2>
              <p className="text-foreground/90 mb-4">
                If you have questions about these Terms or the Services, you can
                contact us at:
              </p>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-foreground font-medium">Promptbox</p>
                <p className="text-foreground/90">Attn: Legal</p>
                <p className="text-foreground/90">
                  Email:{" "}
                  <a
                    href="mailto:legal@promptbox.com"
                    className="text-primary hover:underline"
                  >
                    legal@promptbox.com
                  </a>
                </p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </>
  );
};

export default Terms;
