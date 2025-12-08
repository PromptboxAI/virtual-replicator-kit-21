import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const PromptboxDPA = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Data Processing Addendum | Promptbox</title>
        <meta
          name="description"
          content="Promptbox Data Processing Addendum (DPA) - Learn about how we process personal data in connection with our tokenized AI agent platform."
        />
        <link rel="canonical" href="https://promptbox.com/promptbox-dpa" />
      </Helmet>

      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <article className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Promptbox – Data Processing Addendum (DPA)
            </h1>
            <p className="text-muted-foreground text-sm mb-8 italic">
              Last updated: December 8, 2025
            </p>

            <p className="text-foreground/90 leading-relaxed mb-4">
              This Data Processing Addendum ("<strong>DPA</strong>") forms part
              of the agreement (the "<strong>Agreement</strong>") between:
            </p>

            <ul className="list-disc pl-6 mb-6 text-foreground/90 space-y-2">
              <li>
                Promptbox, Inc., a New York-based company with registered address in Stony Brook, NY
                ("<strong>Promptbox</strong>", "<strong>Processor</strong>", "
                <strong>we</strong>", "<strong>us</strong>", or "
                <strong>our</strong>"), and
              </li>
              <li>
                The customer identified in the Agreement or applicable order
                form ("<strong>Customer</strong>", "<strong>Controller</strong>
                ", or "<strong>you</strong>").
              </li>
            </ul>

            <p className="text-foreground/90 leading-relaxed mb-4">
              This DPA reflects the parties' agreement with regard to the
              processing of Personal Data (as defined below) in connection with
              the Services (as defined in the Agreement). In case of conflict
              between this DPA and the Agreement, this DPA will prevail with
              respect to the subject matter of data protection and privacy.
            </p>

            <p className="text-foreground/90 leading-relaxed mb-8">
              By using the Services in a manner that involves the processing of
              Personal Data subject to Applicable Data Protection Laws, Customer
              agrees to the terms of this DPA.
            </p>

            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Definitions
              </h2>
              <p className="text-foreground/90 mb-4">
                Capitalized terms not defined in this DPA have the meanings
                given in the Agreement.
              </p>
              <p className="text-foreground/90 mb-4">
                For purposes of this DPA:
              </p>
              <ul className="space-y-3 text-foreground/90">
                <li>
                  "<strong className="text-foreground">
                    Applicable Data Protection Laws
                  </strong>
                  " means all data protection and privacy laws and regulations
                  applicable to the processing of Personal Data under the
                  Agreement, which may include, as applicable, the EU General
                  Data Protection Regulation ("<strong>GDPR</strong>"), the UK
                  GDPR, the UK Data Protection Act 2018, and analogous laws in
                  other jurisdictions.
                </li>
                <li>
                  "<strong className="text-foreground">Controller</strong>", "
                  <strong className="text-foreground">Processor</strong>", "
                  <strong className="text-foreground">Data Subject</strong>", "
                  <strong className="text-foreground">Personal Data</strong>", "
                  <strong className="text-foreground">Processing</strong>", "
                  <strong className="text-foreground">
                    Supervisory Authority
                  </strong>
                  ", and "
                  <strong className="text-foreground">
                    Personal Data Breach
                  </strong>
                  " have the meanings given in Applicable Data Protection Laws.
                </li>
                <li>
                  "<strong className="text-foreground">
                    Customer Personal Data
                  </strong>
                  " means any Personal Data in Customer Data that Promptbox
                  processes on behalf of Customer as a Processor in the course
                  of providing the Services.
                </li>
                <li>
                  "<strong className="text-foreground">Sub-Processor</strong>"
                  means any third party engaged by Promptbox to process Customer
                  Personal Data on Promptbox's behalf.
                </li>
                <li>
                  "<strong className="text-foreground">Services</strong>" means
                  the Promptbox platform and related products and services
                  provided by Promptbox to Customer under the Agreement
                  (including tokenized AI agent tools, dashboards, APIs, and
                  integrations).
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. Roles of the Parties
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                2.1 Controller and Processor
              </h3>
              <p className="text-foreground/90 mb-4">
                For purposes of this DPA, Customer is the Controller (or, where
                Customer acts as a processor on behalf of a third-party
                controller, then Customer shall be deemed a "Controller" for
                purposes of this DPA), and Promptbox is the Processor with
                respect to Customer Personal Data.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                2.2 Independent Controllers for Certain Data
              </h3>
              <p className="text-foreground/90">
                Each party may also act as an independent Controller for
                personal data it processes for its own legitimate business
                purposes outside the scope of the Services (e.g., its own
                business contacts, billing data, or product analytics). Such
                processing is governed by each party's own privacy notices and
                not by this DPA.
              </p>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. Subject Matter, Nature, Purpose, and Duration of Processing
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.1 Subject Matter
              </h3>
              <p className="text-foreground/90 mb-4">
                Promptbox will process Customer Personal Data only for the
                purpose of providing, operating, maintaining, and supporting the
                Services under the Agreement.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.2 Nature and Purpose
              </h3>
              <p className="text-foreground/90 mb-2">
                Processing may include collection, storage, organization,
                structuring, transmission, analysis, retrieval, consultation,
                use, disclosure, erasure, and other operations as necessary to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Provide and secure user accounts and workspaces;</li>
                <li>
                  Configure and run AI agents, workflows, and integrations;
                </li>
                <li>
                  Execute on-chain and off-chain operations related to tokens,
                  wallets, and analytics;
                </li>
                <li>
                  Provide support, troubleshooting, and product improvement (on
                  an aggregated or de-identified basis); and
                </li>
                <li>Comply with legal obligations.</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.3 Duration
              </h3>
              <p className="text-foreground/90 mb-4">
                Promptbox will process Customer Personal Data for the term of
                the Agreement and as otherwise required or permitted under
                Applicable Data Protection Laws, or until Customer Personal Data
                is deleted or returned in accordance with this DPA.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3.4 Categories of Data Subjects and Data
              </h3>
              <p className="text-foreground/90">
                Typical categories of Data Subjects and Personal Data are set
                out in Annex 1.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. Customer Instructions
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4.1 Documented Instructions
              </h3>
              <p className="text-foreground/90 mb-4">
                Promptbox will process Customer Personal Data only on Customer's
                documented instructions, as set forth in the Agreement, this
                DPA, and any applicable order forms, or as otherwise documented
                by Customer from time to time, unless Promptbox is required to
                do otherwise under Applicable Data Protection Laws. In such
                case, Promptbox will inform Customer of that legal requirement
                (unless prohibited by law).
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4.2 Instructions via Use of the Services
              </h3>
              <p className="text-foreground/90 mb-4">
                Customer's configuration of the Services, including use of
                dashboards, workflows, and integrations, constitutes further
                instructions to Promptbox for the processing of Customer
                Personal Data.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4.3 No Unlawful Instructions
              </h3>
              <p className="text-foreground/90">
                Customer shall ensure that its instructions comply with
                Applicable Data Protection Laws. Promptbox is not obligated to
                comply with instructions that Promptbox reasonably believes are
                unlawful or would violate Applicable Data Protection Laws.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Promptbox Obligations as Processor
              </h2>
              <p className="text-foreground/90 mb-4">Promptbox will:</p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.1 Confidentiality
              </h3>
              <p className="text-foreground/90 mb-4">
                Ensure that persons authorized to process Customer Personal Data
                are subject to an appropriate duty of confidentiality (whether
                contractual or statutory).
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.2 Security Measures
              </h3>
              <p className="text-foreground/90 mb-4">
                Implement and maintain appropriate technical and organizational
                measures to protect Customer Personal Data against accidental or
                unlawful destruction, loss, alteration, unauthorized disclosure,
                or access, as described in Annex 2 and the Agreement.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.3 Sub-Processors
              </h3>
              <p className="text-foreground/90 mb-4">
                Only engage Sub-Processors in accordance with Section 7 of this
                DPA.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.4 Assistance with Data Subject Requests
              </h3>
              <p className="text-foreground/90 mb-4">
                Taking into account the nature of the processing, Promptbox will
                provide reasonable assistance to Customer, at Customer's request
                and cost, in responding to Data Subjects' requests to exercise
                their rights under Applicable Data Protection Laws (e.g.,
                access, rectification, erasure, restriction, portability, and
                objection), to the extent Customer is unable to fulfill such
                requests through the Services.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.5 Assistance with Impact Assessments
              </h3>
              <p className="text-foreground/90 mb-4">
                Promptbox will provide reasonable assistance to Customer, at
                Customer's request and cost, with data protection impact
                assessments and prior consultations with supervisory
                authorities, to the extent required by Applicable Data
                Protection Laws and related to Promptbox's processing of
                Customer Personal Data and the nature of the Services.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.6 Personal Data Breach Notification
              </h3>
              <p className="text-foreground/90 mb-2">
                Promptbox will notify Customer without undue delay after
                becoming aware of a Personal Data Breach affecting Customer
                Personal Data. Such notification may be provided to Customer's
                designated contact(s) by email or through the Services and will
                describe, to the extent known:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>The nature of the Personal Data Breach;</li>
                <li>
                  The categories and approximate number of affected Data
                  Subjects;
                </li>
                <li>
                  The categories and approximate number of affected Personal
                  Data records;
                </li>
                <li>Likely consequences; and</li>
                <li>
                  Measures taken or proposed by Promptbox to address the
                  Personal Data Breach and mitigate possible adverse effects.
                </li>
              </ul>
              <p className="text-foreground/90 mb-4">
                Customer is responsible for notifying affected Data Subjects
                and/or supervisory authorities as required by law, except to the
                extent Promptbox has specifically agreed to do so.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.7 Deletion or Return of Data
              </h3>
              <p className="text-foreground/90 mb-4">
                Upon termination or expiration of the Agreement, Promptbox will,
                at Customer's choice (and unless otherwise required by law or
                permitted under Applicable Data Protection Laws), delete or
                return Customer Personal Data. If Customer does not request
                deletion or return within a commercially reasonable period,
                Promptbox may delete Customer Personal Data in accordance with
                its standard retention and deletion schedules, subject to any
                legal retention obligations.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                5.8 Records and Compliance
              </h3>
              <p className="text-foreground/90">
                Promptbox will maintain records of its processing activities as
                required by Applicable Data Protection Laws and, upon Customer's
                written request, will make available information reasonably
                necessary to demonstrate compliance with this DPA.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Customer Obligations
              </h2>
              <p className="text-foreground/90 mb-4">Customer agrees that:</p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                6.1 Lawful Basis and Transparency
              </h3>
              <p className="text-foreground/90 mb-4">
                Customer is responsible for ensuring that it has a lawful basis
                and any necessary consents or notices in place for the
                processing of Customer Personal Data via the Services, including
                transmission of Customer Personal Data to Promptbox and to any
                Third-Party Services that Customer chooses to integrate.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                6.2 Accuracy and Minimization
              </h3>
              <p className="text-foreground/90 mb-4">
                Customer will ensure that Customer Personal Data is accurate,
                complete, and limited to what is necessary in relation to the
                purposes for which it is processed.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                6.3 No Prohibited Data
              </h3>
              <p className="text-foreground/90 mb-4">
                Customer will not use the Services to process any categories of
                data that are prohibited under the Agreement or this DPA (such
                as certain highly sensitive data) unless expressly agreed in
                writing by Promptbox.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                6.4 Configuration and Use of Services
              </h3>
              <p className="text-foreground/90 mb-2">
                Customer is responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Configuring the Services appropriately;</li>
                <li>Managing user access and permissions;</li>
                <li>Securing its own systems and credentials; and</li>
                <li>
                  Ensuring that its use of the Services complies with Applicable
                  Data Protection Laws and the Agreement.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. Sub-Processors
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.1 Authorization for Sub-Processors
              </h3>
              <p className="text-foreground/90 mb-4">
                Customer generally authorizes Promptbox to engage Sub-Processors
                to process Customer Personal Data on Promptbox's behalf in
                connection with the Services.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.2 Sub-Processor List
              </h3>
              <p className="text-foreground/90 mb-4">
                A current list of Sub-Processors that may process Customer
                Personal Data (including AI infrastructure providers, hosting
                providers, database services, analytics, and support tools) may
                be made available at:{" "}
                <a
                  href="https://promptbox.com/subprocessors"
                  className="text-primary hover:underline"
                >
                  https://promptbox.com/subprocessors
                </a>{" "}
                (or such other URL as Promptbox may provide from time to time).
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.3 Sub-Processor Obligations
              </h3>
              <p className="text-foreground/90 mb-4">
                Promptbox will enter into a written agreement with each
                Sub-Processor that imposes data protection obligations no less
                protective of Customer Personal Data than those set out in this
                DPA, to the extent applicable to the nature of the services
                provided by such Sub-Processor.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.4 Changes to Sub-Processors
              </h3>
              <p className="text-foreground/90 mb-4">
                Promptbox may update its list of Sub-Processors from time to
                time. Where required by Applicable Data Protection Laws,
                Promptbox will provide Customer with notice of new
                Sub-Processors (e.g., via the Sub-Processor list or email). If
                Customer reasonably objects to a new Sub-Processor on legitimate
                data protection grounds, Customer may notify Promptbox in
                writing within the notice period. Promptbox will discuss in good
                faith to find a commercially reasonable solution. If no solution
                can be reached, Customer may terminate the affected Services
                upon written notice and subject to the terms of the Agreement.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                7.5 Liability
              </h3>
              <p className="text-foreground/90">
                Promptbox remains responsible for the performance of its
                Sub-Processors' obligations to the same extent Promptbox would
                be responsible if performing the Services directly, subject to
                the limitations of liability in the Agreement.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. International Data Transfers
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                8.1 General
              </h3>
              <p className="text-foreground/90 mb-4">
                Promptbox may process and transfer Customer Personal Data
                globally in connection with the Services, including to countries
                that may not provide the same level of data protection as the
                country of origin.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                8.2 Transfers from the EEA, UK, and Switzerland
              </h3>
              <p className="text-foreground/90 mb-2">
                Where Promptbox's processing of Customer Personal Data involves
                a transfer from the European Economic Area ("
                <strong>EEA</strong>"), the United Kingdom ("<strong>UK</strong>
                "), or Switzerland to a country that has not been deemed to
                provide an adequate level of protection, Promptbox will ensure
                that such transfer is subject to appropriate safeguards under
                Applicable Data Protection Laws. These may include:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Execution of standard contractual clauses (SCCs) or their
                  successors;
                </li>
                <li>The UK International Data Transfer Addendum; and/or</li>
                <li>
                  Other lawful transfer mechanisms recognized under Applicable
                  Data Protection Laws.
                </li>
              </ul>
              <p className="text-foreground/90">
                Where SCCs or similar instruments are required, they are deemed
                incorporated into this DPA by reference and will be completed by
                the parties as necessary.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. Audits
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                9.1 Audit Rights
              </h3>
              <p className="text-foreground/90 mb-4">
                Promptbox will make available to Customer, upon written request
                and subject to confidentiality obligations, information
                reasonably necessary to demonstrate compliance with this DPA
                (e.g., security documentation, certifications, or summaries of
                audit reports).
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                9.2 On-Site Audits
              </h3>
              <p className="text-foreground/90 mb-2">
                Where such documentation is not sufficient to demonstrate
                compliance, and to the extent required by Applicable Data
                Protection Laws, Customer may, at its own cost and upon
                reasonable prior written notice, conduct an audit (or have a
                third-party auditor conduct an audit) of Promptbox's relevant
                data processing facilities and systems. Any such audit will:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Occur no more than once per 12-month period (unless required
                  by a supervisory authority or following a confirmed Personal
                  Data Breach involving Customer Personal Data);
                </li>
                <li>
                  Be conducted during normal business hours and in a manner that
                  does not unreasonably interfere with Promptbox's operations;
                </li>
                <li>
                  Be subject to reasonable security, confidentiality, and
                  operational restrictions imposed by Promptbox; and
                </li>
                <li>
                  Be limited in scope to information reasonably necessary to
                  verify compliance with this DPA.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                9.3 Costs
              </h3>
              <p className="text-foreground/90">
                Customer is responsible for all costs associated with any audit,
                including Promptbox's reasonable internal costs and any fees of
                third-party auditors.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Limitation of Liability
              </h2>
              <p className="text-foreground/90">
                The parties' liability arising out of or in connection with this
                DPA is subject to the limitations of liability set forth in the
                Agreement. Nothing in this DPA is intended to limit either
                party's liability where such limitation is not permitted under
                Applicable Data Protection Laws.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                11. Amendments
              </h2>
              <p className="text-foreground/90">
                Promptbox may update this DPA from time to time to reflect
                changes in Applicable Data Protection Laws, industry best
                practices, or the Services. If Promptbox makes material changes
                to this DPA, Promptbox will provide reasonable notice to
                Customer (e.g., by email or through the Services). Continued use
                of the Services after the effective date of the updated DPA
                constitutes Customer's acceptance of the updated DPA.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                12. Order of Precedence
              </h2>
              <p className="text-foreground/90 mb-2">
                In the event of a conflict between this DPA and any other
                agreement between the parties, the following order of precedence
                will apply (unless expressly stated otherwise):
              </p>
              <ol className="list-decimal pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Applicable SCCs or similar data transfer instruments;
                </li>
                <li>This DPA;</li>
                <li>
                  The Agreement (including any order forms or exhibits).
                </li>
              </ol>
            </section>

            {/* Section 13 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                13. Governing Law and Jurisdiction
              </h2>
              <p className="text-foreground/90">
                This DPA is governed by the same law and jurisdiction that
                applies to the Agreement, unless otherwise required by
                Applicable Data Protection Laws or the applicable SCCs.
              </p>
            </section>

            {/* Annex 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Annex 1 – Description of Processing
              </h2>

              <h3 className="text-xl font-medium text-foreground mb-3">
                1. Categories of Data Subjects
              </h3>
              <p className="text-foreground/90 mb-2">
                Depending on Customer's use of the Services, the categories of
                Data Subjects may include:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Customer's authorized users (e.g., employees, contractors, and
                  agents);
                </li>
                <li>
                  Individuals whose personal data is included in prompts,
                  workflows, or uploaded content (e.g., customers, prospects,
                  contacts, end-users);
                </li>
                <li>
                  Individuals whose data appears in logs, analytics, or related
                  operational records (e.g., IP addresses, wallet addresses).
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                2. Categories of Personal Data
              </h3>
              <p className="text-foreground/90 mb-2">
                Customer Personal Data may include, as determined by Customer:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Identification and contact details (e.g., name, email address,
                  username, profile information);
                </li>
                <li>
                  Account and usage data (e.g., user IDs, role/permissions,
                  timestamps, activity logs);
                </li>
                <li>
                  AI agent and workflow data (e.g., prompts, instructions,
                  files, context, outputs that may include personal data);
                </li>
                <li>
                  Wallet and on-chain identifiers (e.g., public wallet
                  addresses, transaction metadata, token holdings, but not
                  private keys);
                </li>
                <li>
                  Device and technical data (e.g., IP address, browser
                  type/version, operating system, user-agent, log data) to the
                  extent they qualify as Personal Data;
                </li>
                <li>
                  Any other Personal Data that Customer chooses to submit to the
                  Services.
                </li>
              </ul>
              <p className="text-foreground/90 mb-4 text-sm italic">
                Customer is responsible for ensuring that the categories of
                Personal Data processed via the Services are compatible with
                Applicable Data Protection Laws and the Agreement.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                3. Special Categories of Personal Data
              </h3>
              <p className="text-foreground/90 mb-4">
                The Services are not intended to process special categories of
                Personal Data (e.g., data revealing racial or ethnic origin,
                political opinions, religious beliefs, trade union membership,
                genetic or biometric data, health data, or data concerning a
                natural person's sex life or sexual orientation), nor personal
                data relating to criminal convictions and offences, unless
                expressly agreed in writing by Promptbox.
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                4. Processing Operations
              </h3>
              <p className="text-foreground/90 mb-2">
                The processing operations performed on Customer Personal Data
                include:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>Collection, receipt, and storage;</li>
                <li>
                  Organization, structuring, and integration with other data;
                </li>
                <li>
                  Use in AI models, workflows, and agents configured by
                  Customer;
                </li>
                <li>
                  Transmission, including to Sub-Processors and Third-Party
                  Services chosen by Customer;
                </li>
                <li>
                  Analysis, logging, and monitoring to provide and improve the
                  Services (on an aggregated or de-identified basis where
                  possible);
                </li>
                <li>Backup, archiving, and recovery;</li>
                <li>
                  Deletion or anonymization, in accordance with this DPA and the
                  Agreement.
                </li>
              </ul>
            </section>

            {/* Annex 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Annex 2 – Technical and Organizational Security Measures
              </h2>
              <p className="text-foreground/90 mb-4">
                Promptbox maintains technical and organizational measures
                designed to protect Customer Personal Data, including:
              </p>

              <h3 className="text-xl font-medium text-foreground mb-3">
                Organizational Measures
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Information security policies and procedures covering access
                  control, incident response, and change management;
                </li>
                <li>
                  Employee confidentiality obligations and security training;
                </li>
                <li>
                  Background checks as permitted by law for relevant personnel.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                Access Control
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Role-based access controls to restrict access to Customer
                  Personal Data on a need-to-know basis;
                </li>
                <li>
                  Authentication mechanisms (e.g., strong passwords, multi-factor
                  authentication for internal systems where appropriate);
                </li>
                <li>Logging and monitoring of administrative access.</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                Physical and Environmental Security
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Use of reputable data centers or cloud providers with
                  industry-standard physical security controls;
                </li>
                <li>
                  Environmental safeguards against fire, flood, and other
                  physical threats.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                Network and Application Security
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Encryption of data in transit using industry-standard
                  protocols (e.g., TLS/HTTPS);
                </li>
                <li>
                  Use of network-level protections (e.g., firewalls, security
                  groups) to limit access to production systems;
                </li>
                <li>
                  Vulnerability management and regular security updates for
                  relevant components;
                </li>
                <li>Secure development practices and review processes.</li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                Data Protection and Backup
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Logical separation of Customer data in multi-tenant
                  environments;
                </li>
                <li>Regular backups of critical data and systems;</li>
                <li>
                  Procedures to restore availability and access to data in a
                  timely manner in case of an incident.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                Incident Detection and Response
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Processes to detect, assess, and respond to security
                  incidents;
                </li>
                <li>
                  Logging and monitoring to help identify anomalous activity;
                </li>
                <li>
                  Notification procedures for Personal Data Breaches in
                  accordance with this DPA.
                </li>
              </ul>

              <h3 className="text-xl font-medium text-foreground mb-3">
                Testing and Evaluation
              </h3>
              <ul className="list-disc pl-6 mb-4 text-foreground/90 space-y-1">
                <li>
                  Periodic internal reviews and assessments of security
                  controls;
                </li>
                <li>
                  Use of third-party security assessments or certifications
                  where appropriate.
                </li>
              </ul>

              <p className="text-foreground/90 text-sm italic">
                Promptbox may update these measures from time to time, provided
                that such updates do not materially reduce the overall level of
                protection for Customer Personal Data.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PromptboxDPA;
