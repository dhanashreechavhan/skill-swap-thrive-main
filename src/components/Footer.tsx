import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const Footer = () => {
  const footerSections = [
    {
      title: "Platform",
      links: [
        { name: "Explore Skills", href: "/explore" },
        { name: "How It Works", href: "/how-it-works" },
        { name: "Pricing", href: "/pricing" },
        { name: "Success Stories", href: "/testimonials" }
      ]
    },
    {
      title: "Community", 
      links: [
        { name: "Help Center", href: "/help" },
        { name: "Community Guidelines", href: "/guidelines" },
        { name: "Blog", href: "/blog" },
        { name: "Events", href: "/events" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Press", href: "/press" },
        { name: "Contact", href: "/contact" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "Security", href: "/security" }
      ]
    }
  ];

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Logo size="md" />
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Connect, learn, and grow with peer-to-peer skill exchange. Build expertise through collaborative learning.
            </p>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 mt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © 2024 SwapLearnThrive. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-sm text-muted-foreground">Follow us:</span>
            <div className="flex space-x-2">
              {/* Social links would go here */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;