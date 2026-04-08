import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen, MessageSquare } from "lucide-react";

const helpTopics = [
  {
    icon: HelpCircle,
    title: "General Help",
    description:
      "Learn how to use the platform and find answers to common questions.",
    link: "#faq",
    button: "View FAQ",
  },
  {
    icon: BookOpen,
    title: "Resources",
    description:
      "Access guides, tutorials, and documentation for students and instructors.",
    link: "/student-resources",
    button: "Go to Resources",
  },
  {
    icon: MessageSquare,
    title: "Feedback & Support",
    description:
      "Contact support or leave feedback to help us improve your experience.",
    link: "#",
    button: "info@trismotorcycles.com",
  },
];

const HelpPage = () => {
  return (
    <div className="">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <HelpCircle className="h-6 w-6 text-primary" /> Help Center
      </h1>
      <p className="text-muted-foreground mb-8">
        Welcome to the Help Center. Here you can find answers, resources, and
        ways to get in touch with support.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {helpTopics.map((topic) => (
          <Card
            key={topic.title}
            className="flex flex-col items-center p-6 text-center"
          >
            <topic.icon className="h-8 w-8 mb-3 text-primary" />
            <h2 className="font-semibold text-lg mb-1">{topic.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {topic.description}
            </p>
            <Button asChild variant="outline" className="w-full">
              <a href={topic.link}>{topic.button}</a>
            </Button>
          </Card>
        ))}
      </div>
      <div id="faq" className="mt-12">
        <h2 className="text-xl font-semibold mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">How do I book a class?</h3>
            <p className="text-sm text-muted-foreground">
              Navigate to the Book Class page from your dashboard and follow the
              prompts to schedule your next lesson.
            </p>
          </div>
          <div>
            <h3 className="font-medium">How do I access my resources?</h3>
            <p className="text-sm text-muted-foreground">
              Go to the Resources section from the sidebar or use the quick
              actions on your dashboard.
            </p>
          </div>
          <div>
            <h3 className="font-medium">
              Who do I contact for technical support?
            </h3>
            <p className="text-sm text-muted-foreground">
              Use the Contact Support button above or email us at{" "}
              <a
                href="mailto:info@trismotorcycles.com"
                className="text-primary underline"
              >
                info@trismotorcycles.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
