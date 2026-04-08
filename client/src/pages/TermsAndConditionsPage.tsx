import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { company } from "@/lib/data";
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  CreditCard,
  CalendarX,
  Lock,
  MessageSquare,
  Globe,
  Scale,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    icon: UserCheck,
    content: (
      <>
        <p>
          By registering for, accessing, or using {company.name}'s driving
          school booking platform (the "Service"), you agree to be bound by
          these Terms and Conditions ("Terms"). If you do not agree to these
          Terms, you must not use the Service.
        </p>
        <p className="mt-3">
          These Terms apply to all users of the Service, including students,
          instructors, administrators, and any other parties who access or use
          the platform.
        </p>
        <p className="mt-3">
          We reserve the right to update these Terms at any time. Continued use
          of the Service after changes are posted constitutes your acceptance of
          the revised Terms.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility & Registration",
    icon: ShieldCheck,
    content: (
      <>
        <p>To use the Service as a student, you must:</p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Be at least 18 years of age or have the consent of a parent/guardian",
            "Hold a valid provisional driving licence or equivalent documentation",
            "Have completed the MSF Riders Course prior to your first class booking",
            "Provide accurate, complete, and up-to-date registration information",
            "Maintain the security of your account credentials",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          {company.name} reserves the right to refuse registration or revoke
          access to any user who provides false information or violates these
          Terms.
        </p>
      </>
    ),
  },
  {
    id: "bookings",
    title: "Booking & Scheduling",
    icon: CalendarX,
    content: (
      <>
        <p>
          All class bookings are subject to instructor availability and are
          confirmed only upon successful completion of the booking process
          within the platform.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">Booking Plans</h4>
            <p>
              Students are enrolled under either a <strong>Noob Plan</strong>{" "}
              (limited to 7 bookings within 30-day period) or an{" "}
              <strong>Ultimate Plan</strong> (unlimited bookings within 30-day
              period). Your plan type is determined by your assigned category
              and may only be changed by an administrator.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">Advance Booking</h4>
            <p>
              Bookings may only be made within the advance booking window
              configured by the school. Bookings for dates beyond this window
              will not be permitted.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">
              Sunday & Holiday Restrictions
            </h4>
            <p>
              Classes are not available on Sundays unless specifically unblocked
              by an administrator. Public holidays and other blocked dates are
              determined at the school's discretion.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">
              Instructor Assignment
            </h4>
            <p>
              {company.name} reserves the right to reassign students to a
              different instructor at any time. Every effort will be made to
              notify students of such changes in advance.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "cancellation",
    title: "Cancellation & No-Show Policy",
    icon: AlertTriangle,
    content: (
      <>
        <p>
          We understand that plans change. However, late cancellations and
          no-shows affect instructor schedules and other students.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">Cancellation Window</h4>
            <p>
              Bookings must be cancelled within the cancellation window set by
              the school (displayed within the platform). Cancellations made
              after this window will be treated as attended classes and will
              count against your booking allowance.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">
              Weather Cancellations
            </h4>
            <p>
              Classes may be cancelled by {company.name} without prior notice
              due to adverse weather conditions, safety concerns, or other
              circumstances beyond our control. In such cases, the booking will
              not be counted against your allowance.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">Repeated No-Shows</h4>
            <p>
              Students who repeatedly fail to attend booked classes without
              cancelling may have their account suspended or their booking
              period reset at the discretion of an administrator.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "conduct",
    title: "Student Conduct & Safety",
    icon: Scale,
    content: (
      <>
        <p>
          All students must adhere to the following conduct and safety
          requirements at all times during classes:
        </p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Arrive at least 10 minutes before your scheduled class time",
            "Wear appropriate attire: full-length trousers (jeans recommended), closed-toe shoes, and appropriate upper-body clothing. Shorts, sandals, and open-toe footwear are strictly prohibited",
            "Bring your own balaclava or helmet liner to every session for hygiene purposes",
            "Comply with all instructions given by your instructor during the class",
            "Refrain from operating any vehicle while under the influence of alcohol, drugs, or any substance that impairs judgement",
            "Not use a mobile phone or other electronic device during an active class session",
            "Report any accidents, injuries, or safety concerns to an instructor immediately",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Failure to comply with safety requirements may result in immediate
          termination of the class session without refund or booking credit.
        </p>
      </>
    ),
  },
  {
    id: "payment",
    title: "Fees & Payment",
    icon: CreditCard,
    content: (
      <>
        <p>
          All fees for driving classes must be paid in accordance with the
          payment terms communicated by {company.name} at the time of enrolment.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">Fee Structure</h4>
            <p>
              Fees are charged per booking plan (Noob or Ultimate) or per
              individual class as agreed. {company.name} reserves the right to
              update its fee structure with reasonable notice.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Refunds</h4>
            <p>
              Refunds are issued at the sole discretion of {company.name}.
              Classes cancelled within the permitted window will not be charged.
              No refunds will be issued for classes that were attended, for
              no-shows, or for cancellations made outside the permitted window.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Disputes</h4>
            <p>
              Any billing disputes must be raised with the administration team
              within 7 days of the disputed charge. {company.name} will
              endeavour to resolve disputes fairly and promptly.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Privacy & Data",
    icon: Lock,
    content: (
      <>
        <p>
          {company.name} is committed to protecting your personal data. By using
          the Service, you consent to the collection and use of your information
          as described below.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">Data We Collect</h4>
            <p>
              We collect information you provide during registration (name,
              email, phone number), booking records, session history, and
              feedback submitted through the platform.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">How We Use Your Data</h4>
            <p>
              Your data is used solely to operate and improve the Service,
              communicate with you about your bookings, and comply with legal
              obligations. We do not sell your data to third parties.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Data Retention</h4>
            <p>
              We retain your personal data for as long as your account is active
              or as required by applicable law. You may request deletion of your
              data by contacting the administration team.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "feedback",
    title: "Feedback & Communications",
    icon: MessageSquare,
    content: (
      <>
        <p>
          Feedback submitted through the platform is used to improve the quality
          of instruction and the overall student experience.
        </p>
        <p className="mt-3">
          By submitting feedback, you grant {company.name} a non-exclusive,
          royalty-free licence to use, display, and share your feedback
          (anonymously where appropriate) for quality assurance and marketing
          purposes.
        </p>
        <p className="mt-3">
          You agree not to submit feedback that is defamatory, harassing,
          discriminatory, or otherwise unlawful. {company.name} reserves the
          right to remove any feedback that violates these standards.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    icon: Globe,
    content: (
      <>
        <p>
          To the fullest extent permitted by law, {company.name} shall not be
          liable for any indirect, incidental, special, consequential, or
          punitive damages arising out of or related to your use of the Service.
        </p>
        <p className="mt-3">
          {company.name} makes no representations or warranties that the Service
          will be uninterrupted, error-free, or free from viruses or other
          harmful components.
        </p>
        <p className="mt-3">
          Participation in driving classes involves inherent physical risk.
          Students participate at their own risk and are required to adhere to
          all safety instructions. {company.name} shall not be liable for
          injuries sustained during classes where the student has failed to
          follow instructor guidance or safety requirements.
        </p>
      </>
    ),
  },
  {
    id: "governing",
    title: "Governing Law",
    icon: Scale,
    content: (
      <>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of Kenya, without regard to its conflict of law provisions. Any
          disputes arising under these Terms shall be subject to the exclusive
          jurisdiction of the courts of Kenya.
        </p>
        <p className="mt-3">
          If any provision of these Terms is found to be invalid or
          unenforceable, the remaining provisions shall continue in full force
          and effect.
        </p>
      </>
    ),
  },
];

const TermsAndConditionsPage = () => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="space-y-6 px-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1 text-xs">
          {company.name} · Driving School
        </Badge>
      </div>

      {/* Intro banner */}
      <div className="rounded-xl border bg-primary/5 border-primary/20 px-5 py-4 text-sm text-muted-foreground">
        Please read these Terms and Conditions carefully before using the{" "}
        <span className="font-semibold text-foreground">{company.name}</span>{" "}
        platform. By creating an account or booking a class, you agree to be
        bound by these terms.
      </div>

      <div className="flex gap-6 items-start">
        {/* Sticky sidebar TOC — desktop only */}
        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-6 self-start">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Contents
          </p>
          <nav className="space-y-0.5">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors",
                    activeSection === s.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <span className="text-[10px] font-mono w-4 text-center opacity-50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{s.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-0">
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                id={section.id}
                ref={(el) => {
                  sectionRefs.current[section.id] = el;
                }}
              >
                <div className="py-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-base font-display font-semibold">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <div className="pl-11 text-sm text-muted-foreground leading-relaxed">
                    {section.content}
                  </div>
                </div>
                {i < SECTIONS.length - 1 && <Separator />}
              </div>
            );
          })}

          {/* Footer */}
          <div className="pt-8 pb-4">
            <Separator className="mb-6" />
            <div className="rounded-xl border bg-muted/30 px-5 py-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{company.name}</p>
              <p>
                If you have any questions about these Terms, please contact our
                administration team through the platform or call us at{" "}
                <span className="font-medium text-foreground">0711847481</span>.
              </p>
              <p className="mt-2 opacity-70">
                © {new Date().getFullYear()} {company.name}. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
