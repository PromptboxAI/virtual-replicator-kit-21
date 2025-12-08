import { Helmet } from "react-helmet-async";

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Promptbox</title>
        <meta
          name="description"
          content="Promptbox Privacy Policy - Learn how we collect, use, and protect your information when using our tokenized AI agent launchpad."
        />
        <link rel="canonical" href="https://promptbox.com/privacy" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <article className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Promptbox Privacy Policy
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              Last updated: December 8, 2025
            </p>

            <p className="text-foreground/90 leading-relaxed mb-6">
              Your privacy is important to us. This Privacy Policy explains how
              Promptbox ("Promptbox", "we", "us", or "our") collects, uses,
              shares, and protects information when you:
            </p>

            <ul className="list-disc pl-6 mb-6 text-foreground/90 space-y-2">
              <li>
                Visit our website at promptbox.com and any subdomains (the
                "Site"), and
              </li>
              <li>
                Use our products and services, including the Promptbox platform,
                tokenized AI agent launchpad, dashboards, and related tools
                (collectively, the "Services").
              </li>
            </ul>

            <p className="text-foreground/90 leading-relaxed mb-6">
              This Privacy Policy does not apply to third-party websites,
              services, blockchains, or applications that we do not own or
              control, even if you access them through our Services.
            </p>

            <p className="text-foreground/90 leading-relaxed mb-8">
              By using the Site or Services, you agree to the practices
              described in this Privacy Policy.
            </p>

            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Key Definitions
              </h2>
              <ul className="space-y-3 text-foreground/90">
                <li>
                  <strong className="text-foreground">Site</strong> – Our
                  website at promptbox.com and related pages.
                </li>
                <li>
                  <strong className="text-foreground">Services</strong> – All
                  products, applications, tools, dashboards, APIs, and features
                  provided by Promptbox (including token creation, bonding
                  curves, AI agents, analytics, and integrations).
                </li>
                <li>
                  <strong className="text-foreground">
                    User, "you", "your"
                  </strong>{" "}
                  – Anyone who visits the Site or uses the Services, including
                  creators, token buyers, and end-users of AI agents.
                </li>
                <li>
                  <strong className="text-foreground">
                    Personal Information
                  </strong>{" "}
                  – Any information that identifies or can reasonably be linked
                  to an individual (e.g., name, email, IP address, wallet
                  address when associated with an account).
                </li>
                <li>
                  <strong className="text-foreground">
                    Project / Agent Data
                  </strong>{" "}
                  – Prompts, workflows, templates, configurations, uploaded
                  documents, integrations, and logs related to your AI agents
                  and tokens on Promptbox.
                </li>
                <li>
                  <strong className="text-foreground">Wallet Data</strong> –
                  Information related to blockchain wallets used with Promptbox
                  (e.g., wallet addresses, on-chain transactions and balances
                  that we associate with your account).
                </li>
                <li>
                  <strong className="text-foreground">Data Controller</strong> –
                  The entity that decides why and how Personal Information is
                  processed. For most uses of the Site and Services, Promptbox
                  is the Data Controller.
                </li>
                <li>
                  <strong className="text-foreground">Data Processor</strong> –
                  An entity that processes Personal Information on behalf of a
                  Data Controller. In some enterprise or white-label scenarios,
                  we may act as a Data Processor for our customers.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. How We Collect Information
              </h2>
              <p className="text-foreground/90 mb-4">
                We collect information in several ways:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                2.1 Information You Provide Directly
              </h3>
              <p className="text-foreground/90 mb-2">
                You may provide information when you:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Create an account or profile</li>
                <li>Connect a wallet or authorize a wallet provider</li>
                <li>Configure or launch tokens and AI agents</li>
                <li>Upload documents, data, or knowledge bases</li>
                <li>Fill out forms, request demos, or join waitlists</li>
                <li>Participate in surveys, promotions, or beta programs</li>
                <li>Contact us by email, support ticket, or other channels</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                2.2 Information Collected Automatically
              </h3>
              <p className="text-foreground/90 mb-2">
                When you use the Site or Services, we automatically collect
                certain information, such as:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device type, operating system, and settings</li>
                <li>Language preferences</li>
                <li>Referring and exit pages</li>
                <li>
                  Pages viewed, features used, clicks, session duration
                </li>
                <li>Error logs and performance metrics</li>
                <li>
                  Usage data related to AI agents, workflows, and tokens (e.g.,
                  volume, holders, trades, inferences, transaction counts)
                </li>
              </ul>
              <p className="text-foreground/90 mb-4">
                We may use cookies, local storage, and similar technologies to
                collect some of this information. See Section 9 (Cookies) for
                more details.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                2.3 Information from Third Parties
              </h3>
              <p className="text-foreground/90 mb-2">
                We may receive information about you from:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  <strong>Wallet providers and blockchain networks</strong> –
                  e.g., wallet addresses, balances, transaction history that are
                  publicly visible on-chain and/or returned by APIs you choose
                  to connect.
                </li>
                <li>
                  <strong>Analytics and attribution tools</strong> – e.g.,
                  traffic sources, campaign performance, and aggregated usage
                  metrics.
                </li>
                <li>
                  <strong>Payment processors</strong> – e.g., limited billing
                  and payment confirmation details.
                </li>
                <li>
                  <strong>Identity or authentication providers (if used)</strong>{" "}
                  – e.g., sign-in using Google, GitHub, or similar.
                </li>
                <li>
                  <strong>Integration partners</strong> – e.g., data from tools
                  you connect to your agents (CRMs, messaging apps,
                  communication platforms, etc.).
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                2.4 Publicly Available and On-Chain Information
              </h3>
              <p className="text-foreground/90">
                Certain information (such as blockchain transactions, token
                balances, and contract interactions on networks like Base or
                other chains we support) is inherently public and recorded on
                decentralized ledgers that we do not control. We may read and
                associate some of this on-chain data with your Promptbox account
                to power features of the Services.
              </p>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. What Information We Collect
              </h2>
              <p className="text-foreground/90 mb-4">
                Depending on how you interact with Promptbox, we may collect the
                following categories of information:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.1 Account & Contact Information
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Name and/or display name</li>
                <li>Email address</li>
                <li>Username or handle</li>
                <li>
                  Password or other authentication credentials (stored using
                  industry-standard security practices)
                </li>
                <li>
                  Company name, role, and other professional details (if
                  provided)
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.2 Wallet & Blockchain Information
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Wallet addresses you connect or that are automatically created
                  for you through the Services
                </li>
                <li>
                  On-chain activity associated with those addresses (e.g., token
                  purchases, transfers, liquidity positions, bonding-curve
                  events, governance transactions)
                </li>
                <li>
                  Network(s) used (e.g., Base, other EVM-compatible networks, or
                  other chains we support)
                </li>
              </ul>
              <p className="text-foreground/90 mb-4 text-sm italic">
                We do not control the blockchain; data written to the blockchain
                is generally public and cannot be altered or deleted by us.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.3 Billing & Transaction Information
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Subscription tier and plan details</li>
                <li>
                  Amounts paid, payment dates, currency, and transaction
                  identifiers
                </li>
                <li>
                  Partial billing information from payment processors (we do not
                  store full payment card numbers)
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.4 Project, Token & Agent Data
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Token configurations (name, symbol, supply, bonding-curve
                  parameters, launch thresholds, etc.)
                </li>
                <li>
                  Agent configurations (role, description, templates, workflows,
                  actions, integrations)
                </li>
                <li>
                  Prompts, instructions, and metadata used to drive AI agents
                </li>
                <li>
                  Files and documents uploaded into Promptbox (e.g., PDFs, text,
                  datasets)
                </li>
                <li>
                  Logs and metadata of agent activity (e.g., inferences,
                  triggers, success/error status)
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.5 AI Interaction Data
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Inputs you send to AI models via Promptbox (e.g., prompts,
                  questions, context)
                </li>
                <li>
                  Outputs returned by the models (e.g., responses, generated
                  content)
                </li>
                <li>
                  Metadata such as model used, tokens consumed, timestamps, and
                  success/error status
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.6 Device & Usage Data
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Device identifiers, IP address, browser type, OS, screen
                  resolution
                </li>
                <li>
                  Session information (pages viewed, navigation paths, time on
                  page)
                </li>
                <li>
                  Feature usage (e.g., which dashboards you access, how often
                  agents are run, how many agents you create)
                </li>
                <li>
                  Log data used for debugging, security monitoring, and
                  performance optimization
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.7 Communications & Support
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Messages and attachments sent to support</li>
                <li>Feedback, survey responses, or reviews</li>
                <li>Communication preferences (e.g., marketing opt-in/out)</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. How We Use Your Information
              </h2>
              <p className="text-foreground/90 mb-4">
                We use the information we collect for the following purposes:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4.1 To Provide and Maintain the Services
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Creating and managing your account</li>
                <li>Authenticating you and securing access</li>
                <li>
                  Generating and managing wallets, tokens, bonding curves, and
                  AI agents
                </li>
                <li>
                  Running workflows, executing trades or actions via
                  integrations (when you configure agents to do so)
                </li>
                <li>
                  Displaying analytics and dashboards (e.g., holders, volume,
                  market cap, inferences)
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4.2 To Improve and Develop the Services
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Monitoring usage to understand how features are used</li>
                <li>Fixing bugs and troubleshooting technical issues</li>
                <li>Testing new features and optimizations</li>
                <li>
                  Performing analytics and research on an aggregated or
                  de-identified basis
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4.3 To Communicate with You
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Sending administrative messages (e.g., account verification,
                  security alerts, billing messages, feature updates)
                </li>
                <li>
                  Sending marketing communications and newsletters where
                  permitted by law (you can opt out at any time)
                </li>
                <li>Responding to support requests and inquiries</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4.4 To Enable AI and Integrations
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Sending your prompts, context, and relevant data to AI model
                  providers you select (e.g., OpenAI, other supported models) to
                  generate outputs
                </li>
                <li>
                  Connecting to and operating integrations you choose (e.g.,
                  messaging apps, CRMs, trading APIs, or other third-party
                  tools)
                </li>
                <li>
                  Logging and displaying agent behavior so you can audit, debug,
                  and optimize your agents
                </li>
              </ul>
              <p className="text-foreground/90 mb-4 text-sm italic">
                We aim to configure third-party AI providers and integrations in
                a way that limits their use of your data to providing the
                requested inference or service. However, each provider's
                handling of data is ultimately governed by its own terms and
                policies, which you should review.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4.5 To Protect Our Platform and Comply with Law
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Detecting and preventing fraud, abuse, or security incidents</li>
                <li>Enforcing our Terms of Service and other agreements</li>
                <li>
                  Complying with legal obligations, regulatory requirements, and
                  lawful requests
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Legal Bases for Processing (EEA/UK Users)
              </h2>
              <p className="text-foreground/90 mb-4">
                If you are located in the European Economic Area, Switzerland,
                or the UK, we process your Personal Information under one or
                more of the following legal bases:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  <strong className="text-foreground">Contract</strong> – To
                  provide the Services you request and perform our agreement
                  with you.
                </li>
                <li>
                  <strong className="text-foreground">
                    Legitimate Interests
                  </strong>{" "}
                  – To operate, improve, and secure our Services in a way that
                  is balanced with your rights.
                </li>
                <li>
                  <strong className="text-foreground">Consent</strong> – For
                  certain marketing communications, cookies, or optional data
                  uses (where required).
                </li>
                <li>
                  <strong className="text-foreground">Legal Obligation</strong>{" "}
                  – To comply with applicable laws, regulations, and legal
                  processes.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Your Choices About Your Information
              </h2>
              <p className="text-foreground/90 mb-4">
                You have several choices regarding how your information is used:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                6.1 Account & Profile
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  You may update certain account details (e.g., name, email)
                  through your account settings.
                </li>
                <li>
                  You may deactivate your account by contacting us (see
                  Contacting Us below).
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                6.2 Marketing Communications
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  You can opt out of marketing emails by clicking the
                  "unsubscribe" link in those emails or adjusting your
                  preferences (where available).
                </li>
                <li>
                  Even if you opt out of marketing, we may still send you
                  non-promotional messages related to your account or
                  transactions.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                6.3 Cookies & Tracking Technologies
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  You can manage cookies through your browser settings,
                  including blocking or deleting them.
                </li>
                <li>
                  If you disable cookies, some parts of the Site and Services
                  may not function properly.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                6.4 Agent & Project Visibility
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  You may have options to keep certain agents, dashboards, or
                  token pages private or share them publicly.
                </li>
                <li>
                  Information you choose to make public (e.g., specific project
                  pages, community dashboards) may be visible to others and
                  could be cached or copied by third parties.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. How We Share Information
              </h2>
              <p className="text-foreground/90 mb-4">
                We do not sell your Personal Information. We may share
                information in the following situations:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.1 Service Providers
              </h3>
              <p className="text-foreground/90 mb-2">
                We share information with trusted third-party vendors who help
                us operate the Services, for example:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Hosting and infrastructure providers</li>
                <li>Analytics and monitoring tools</li>
                <li>Payment processors</li>
                <li>Communication and email delivery services</li>
                <li>Customer support and ticketing systems</li>
              </ul>
              <p className="text-foreground/90 mb-4 text-sm italic">
                These providers are only allowed to use your information to
                perform services on our behalf and must protect it in accordance
                with their contractual obligations.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.2 AI Model and Integration Providers
              </h3>
              <p className="text-foreground/90 mb-4">
                When you use an AI model or integration through Promptbox,
                relevant data may be sent to that provider so it can fulfill
                your request (e.g., generating an AI response, placing a trade,
                posting to a social channel). That provider's handling of data
                is governed by its own terms and privacy policy.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.3 Other Users and the Public
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Information you intentionally make public through the Services
                  (such as public token pages, leaderboards, or community
                  agents) may be viewable by others.
                </li>
                <li>
                  On-chain data, such as transactions and token activity, is
                  public by design and can be viewed by anyone through
                  blockchain explorers and analytics tools.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.4 Affiliates and Corporate Transactions
              </h3>
              <p className="text-foreground/90 mb-4">
                We may share information with our affiliates (entities under
                common ownership or control) and in connection with a corporate
                transaction, such as a merger, acquisition, reorganization, or
                sale of assets.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.5 Legal, Safety, and Security
              </h3>
              <p className="text-foreground/90 mb-2">
                We may disclose information if we believe it is necessary to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Comply with applicable laws, regulations, legal processes, or
                  government requests
                </li>
                <li>Enforce our terms and agreements</li>
                <li>Investigate and prevent fraud or abuse</li>
                <li>
                  Protect the rights, property, and safety of Promptbox, our
                  users, or others
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. International Data Transfers
              </h2>
              <p className="text-foreground/90 mb-4">
                We may store and process your information in the United States
                and other countries where we or our service providers operate.
                These locations may have data-protection laws that differ from
                those in your jurisdiction.
              </p>
              <p className="text-foreground/90">
                Where required, we take appropriate safeguards to ensure that
                cross-border transfers of Personal Information are carried out
                in compliance with applicable laws (for example, using standard
                contractual clauses approved by regulators).
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. Cookies and Similar Technologies
              </h2>
              <p className="text-foreground/90 mb-2">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Keep you signed in</li>
                <li>Remember your preferences</li>
                <li>Understand how you use the Site and Services</li>
                <li>Improve performance and security</li>
                <li>
                  Provide analytics and, where applicable, personalized content
                  or marketing
                </li>
              </ul>
              <p className="text-foreground/90 mb-4">
                Most browsers allow you to control cookies via settings (e.g.,
                blocking or deleting them). Note that if you disable cookies,
                some functionality may be limited or unavailable.
              </p>
              <p className="text-foreground/90">
                At this time, we do not respond to "Do Not Track" browser
                signals.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Data Security
              </h2>
              <p className="text-foreground/90 mb-2">
                We use reasonable organizational, technical, and administrative
                measures designed to protect Personal Information against
                unauthorized access, loss, misuse, or alteration. Examples
                include:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Encryption of data in transit (e.g., HTTPS/TLS)</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Logging and monitoring of key systems</li>
                <li>Regular updates and security reviews</li>
              </ul>
              <p className="text-foreground/90 mb-4">
                No method of transmission or storage is 100% secure. If you
                believe your interaction with us is no longer secure, please
                contact us immediately.
              </p>
              <p className="text-foreground/90">
                You are responsible for maintaining the confidentiality of your
                account credentials and for restricting access to your devices
                and wallets.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                11. Data Retention
              </h2>
              <p className="text-foreground/90 mb-2">
                We retain Personal Information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Provide the Services and fulfill the purposes described in
                  this Policy
                </li>
                <li>Comply with legal and regulatory obligations</li>
                <li>Resolve disputes and enforce our agreements</li>
              </ul>
              <p className="text-foreground/90 mb-4">
                We may retain aggregated or de-identified data that no longer
                identifies an individual for longer periods for analytics,
                research, and business purposes.
              </p>
              <p className="text-foreground/90">
                On-chain data may be stored indefinitely by the underlying
                blockchain and cannot be altered or removed by Promptbox.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                12. Third-Party Sites and Services
              </h2>
              <p className="text-foreground/90 mb-4">
                The Services may contain links to third-party websites,
                applications, or services (including blockchain explorers, DEX
                interfaces, social platforms, and documentation sites). We are
                not responsible for the privacy practices or content of those
                third parties.
              </p>
              <p className="text-foreground/90">
                We encourage you to review the privacy policies of any
                third-party services you use in connection with Promptbox.
              </p>
            </section>

            {/* Section 13 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                13. Children's Privacy
              </h2>
              <p className="text-foreground/90 mb-4">
                The Services are not directed to individuals under the age of
                13, and we do not knowingly collect Personal Information from
                children under 13. If we learn that we have collected Personal
                Information from a child under 13, we will take reasonable steps
                to delete it.
              </p>
              <p className="text-foreground/90">
                If you are a parent or guardian and believe that your child has
                provided Personal Information to us, please contact us.
              </p>
            </section>

            {/* Section 14 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                14. Your Rights
              </h2>
              <p className="text-foreground/90 mb-4">
                Depending on your location, you may have certain rights
                regarding your Personal Information, including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-2">
                <li>
                  <strong className="text-foreground">Access</strong> – Request
                  a copy of the Personal Information we hold about you.
                </li>
                <li>
                  <strong className="text-foreground">Correction</strong> –
                  Request that we correct inaccurate or incomplete information.
                </li>
                <li>
                  <strong className="text-foreground">Deletion</strong> –
                  Request that we delete certain Personal Information, subject
                  to legal exceptions.
                </li>
                <li>
                  <strong className="text-foreground">Restriction</strong> –
                  Request that we restrict certain processing activities.
                </li>
                <li>
                  <strong className="text-foreground">Portability</strong> –
                  Request that we provide certain information in a structured,
                  commonly used, and machine-readable format.
                </li>
                <li>
                  <strong className="text-foreground">Objection</strong> –
                  Object to processing based on legitimate interests or direct
                  marketing.
                </li>
                <li>
                  <strong className="text-foreground">Withdraw Consent</strong>{" "}
                  – Where processing is based on consent, withdraw that consent
                  at any time.
                </li>
              </ul>
              <p className="text-foreground/90 mb-4">
                To exercise these rights, please contact us using the details in
                Contacting Us below. We may need to verify your identity before
                responding.
              </p>
              <p className="text-foreground/90 mb-4">
                Some data (e.g., on-chain records) cannot be modified or deleted
                by Promptbox, but we can update how we associate that data with
                your account where possible.
              </p>
              <p className="text-foreground/90">
                If you are in the EEA, Switzerland, or the UK, you also have the
                right to lodge a complaint with your local data-protection
                authority.
              </p>
            </section>

            {/* Section 15 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                15. Changes to This Privacy Policy
              </h2>
              <p className="text-foreground/90 mb-2">
                We may update this Privacy Policy from time to time. If we make
                material changes, we will notify you by:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Posting the updated Policy on this page, and/or</li>
                <li>
                  Sending an email or in-app notification, where appropriate
                </li>
              </ul>
              <p className="text-foreground/90">
                The "Last updated" date at the top of this page indicates when
                the latest changes were made. Your continued use of the Site or
                Services after the revised Policy becomes effective means you
                accept the changes.
              </p>
            </section>

            {/* Section 16 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                16. Contacting Us
              </h2>
              <p className="text-foreground/90 mb-4">
                If you have questions, concerns, or requests regarding this
                Privacy Policy or our privacy practices, you can contact us at:
              </p>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-foreground font-medium">Promptbox</p>
                <p className="text-foreground/90">Attn: Privacy</p>
                <p className="text-foreground/90">
                  Email:{" "}
                  <a
                    href="mailto:privacy@promptbox.com"
                    className="text-primary hover:underline"
                  >
                    privacy@promptbox.com
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

export default Privacy;
