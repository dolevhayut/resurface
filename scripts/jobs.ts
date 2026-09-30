// 20 fictional demo job descriptions. Sections follow a common JD layout so both JEV and the
// offline drafter can locate requirements; wording varies on purpose.

export const JOBS: { title: string; team: string; location: string; description: string }[] = [
  {
    title: "Senior Full Stack Engineer",
    team: "Platform",
    location: "Tel Aviv · Hybrid",
    description: `About the role:
We are a B2B SaaS company building workflow software for logistics teams. You will own features end to end, from database to UI.
What you'll do:
- Design and ship customer-facing features across our React front end and Node.js services
- Own services in production, including on-call rotation
Requirements:
- 5+ years of professional software engineering experience
- Hands-on React development in production applications
- Building backend services with Node.js
- Designing relational database schemas (PostgreSQL or MySQL)
Nice to have:
- Deploying and operating services on AWS or GCP
- Experience in a B2B SaaS product company
- Leading a technical project or mentoring engineers
Benefits:
- Hybrid work, learning budget, equity`,
  },
  {
    title: "Frontend Engineer",
    team: "Web",
    location: "Remote (EU)",
    description: `About us:
A design-led fintech with a fast-growing web app.
Requirements:
- 3+ years building web applications professionally
- Strong TypeScript skills
- Production experience with React
- Implementing accessible UI (WCAG) and responsive layouts
Nice to have:
- Design systems or component libraries
- Performance optimization (Core Web Vitals)
- Testing with Playwright, Cypress or Testing Library`,
  },
  {
    title: "Backend Engineer, Payments",
    team: "Payments",
    location: "London · Hybrid",
    description: `What you'll do:
- Build and scale the services that move money for our merchants
Requirements:
- 4+ years of backend engineering experience
- Python or Go in production
- Building REST or gRPC APIs consumed by other teams
- Payments, billing or ledger systems experience
Nice to have:
- Event-driven architectures with Kafka or similar
- PCI-DSS compliance work`,
  },
  {
    title: "DevOps / Platform Engineer",
    team: "Infrastructure",
    location: "Haifa · On-site",
    description: `About the role:
Own the platform our 60 engineers deploy to every day.
Requirements:
- Running Kubernetes clusters in production
- Infrastructure as code with Terraform
- Operating workloads on AWS
- Building CI/CD pipelines
Nice to have:
- Observability stacks (Prometheus, Grafana, Datadog)
- Cost optimization of cloud infrastructure
- Incident management and on-call leadership`,
  },
  {
    title: "Data Engineer",
    team: "Data",
    location: "Tel Aviv · Hybrid",
    description: `What you'll do:
- Build reliable pipelines feeding analytics and ML
Requirements:
- 3+ years in data engineering
- Advanced SQL
- Building batch pipelines with Spark or dbt
- Workflow orchestration with Airflow or Dagster
Nice to have:
- Streaming with Kafka or Kinesis
- Data warehouse experience (Snowflake, BigQuery, Redshift)`,
  },
  {
    title: "Machine Learning Engineer",
    team: "AI",
    location: "Remote (US/EU)",
    description: `About us:
We ship ranking and NLP models to millions of users.
Requirements:
- Training and deploying machine learning models to production
- Python and PyTorch or TensorFlow
- Working with NLP or recommendation systems
Nice to have:
- MLOps: model monitoring, feature stores, experiment tracking
- Large language model fine-tuning or evaluation
- Published research or open-source ML work`,
  },
  {
    title: "iOS Engineer",
    team: "Mobile",
    location: "Tel Aviv · Hybrid",
    description: `Requirements:
- 3+ years of native iOS development
- Swift and SwiftUI or UIKit
- Shipping apps to the App Store
Nice to have:
- Offline-first data sync
- Mobile CI (Fastlane, Xcode Cloud)
- Experience with React Native or Flutter`,
  },
  {
    title: "QA Automation Engineer",
    team: "Quality",
    location: "Jerusalem · Hybrid",
    description: `What you'll do:
- Own test automation for our web and API products
Requirements:
- Writing automated end-to-end tests (Playwright, Cypress or Selenium)
- API testing and test automation frameworks
- Integrating tests into CI pipelines
Nice to have:
- Performance or load testing
- Programming experience in TypeScript or Python`,
  },
  {
    title: "Application Security Engineer",
    team: "Security",
    location: "Tel Aviv · Hybrid",
    description: `Requirements:
- Application security experience: threat modeling and secure code review
- Running penetration tests or bug bounty programs
- Securing cloud environments (AWS, GCP or Azure)
Nice to have:
- SAST/DAST tooling in CI
- Security certifications (OSCP, CISSP)
- Compliance programs such as SOC 2 or ISO 27001`,
  },
  {
    title: "Engineering Manager",
    team: "Engineering",
    location: "Tel Aviv · Hybrid",
    description: `About the role:
Lead a team of 6–8 engineers building our core product.
Requirements:
- Managing a team of software engineers (hiring, 1:1s, performance)
- Hands-on software engineering background
- Delivering projects across multiple teams
Nice to have:
- Scaling a team through rapid growth
- Experience in a SaaS company`,
  },
  {
    title: "Product Manager, B2B SaaS",
    team: "Product",
    location: "Tel Aviv · Hybrid",
    description: `What you'll do:
- Own the roadmap for our enterprise workflow product
Requirements:
- 3+ years of product management experience
- Managing a B2B SaaS product
- Working directly with enterprise customers on discovery
- Defining and tracking product metrics
Nice to have:
- Technical background or engineering degree
- Experience with pricing or packaging`,
  },
  {
    title: "Product Designer",
    team: "Design",
    location: "Remote (EU)",
    description: `Requirements:
- End-to-end product design for web or mobile apps
- Figma proficiency and prototyping
- Conducting user research and usability testing
- A portfolio of shipped work
Nice to have:
- Building or maintaining a design system
- Designing data-heavy dashboards`,
  },
  {
    title: "Data Analyst",
    team: "Analytics",
    location: "Tel Aviv · Hybrid",
    description: `Requirements:
- SQL for analysis on large datasets
- Building dashboards in Looker, Tableau or Power BI
- Presenting insights to business stakeholders
Nice to have:
- Python or R for analysis
- A/B test design and analysis`,
  },
  {
    title: "Customer Success Manager",
    team: "Customer Success",
    location: "New York · Hybrid",
    description: `Requirements:
- Managing a portfolio of B2B SaaS customers
- Driving renewals and expansion revenue
- Running onboarding and business reviews (QBRs)
Nice to have:
- Enterprise accounts experience
- Experience with Gainsight or similar CS platforms`,
  },
  {
    title: "Account Executive, Mid-Market",
    team: "Sales",
    location: "London · Hybrid",
    description: `Requirements:
- 2+ years of closing B2B SaaS deals
- Consistently meeting or exceeding a sales quota
- Running full-cycle sales from discovery to close
Nice to have:
- Selling to technical buyers
- Salesforce CRM experience`,
  },
  {
    title: "Growth Marketing Manager",
    team: "Marketing",
    location: "Remote",
    description: `Requirements:
- Running paid acquisition campaigns (Google Ads, Meta, LinkedIn)
- Owning a marketing budget and CAC targets
- Experimentation on landing pages and funnels
Nice to have:
- Marketing automation (HubSpot, Marketo)
- B2B SaaS marketing experience`,
  },
  {
    title: "HR Business Partner",
    team: "People",
    location: "Tel Aviv · On-site",
    description: `Requirements:
- HR business partnering with leadership teams
- Employee relations and performance management processes
- Knowledge of labor law
Nice to have:
- Supporting a tech company through growth
- Compensation and benefits programs`,
  },
  {
    title: "FP&A Analyst",
    team: "Finance",
    location: "Tel Aviv · Hybrid",
    description: `Requirements:
- Financial planning, budgeting and forecasting
- Advanced Excel or Google Sheets financial modeling
- Monthly variance analysis and reporting to management
Nice to have:
- SaaS metrics (ARR, churn, LTV)
- CPA or finance degree`,
  },
  {
    title: "Technical Writer",
    team: "Developer Experience",
    location: "Remote",
    description: `Requirements:
- Writing developer documentation for APIs or SDKs
- Reading code samples in at least one programming language
- Docs-as-code workflows (Git, Markdown)
Nice to have:
- Experience with OpenAPI or docs platforms
- Creating tutorials or video content`,
  },
  {
    title: "Solutions Engineer",
    team: "Sales Engineering",
    location: "Tel Aviv · Hybrid",
    description: `About the role:
You are the technical voice of our sales team, taking prospects from first demo to a working proof-of-concept.
Requirements:
- 3+ years in a customer-facing technical role
- Running technical product demos for prospects
- Scripting or coding ability (Python, JavaScript)
- Integrating APIs for customer proof-of-concepts
- Explaining technical concepts to non-technical buyers
Nice to have:
- Pre-sales in B2B SaaS
- Customer-facing troubleshooting experience
- SQL or data querying
Benefits:
- Hybrid work, commission plan, learning budget`,
  },
];
