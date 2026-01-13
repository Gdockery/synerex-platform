import { useEffect, useState } from "react";

export default function InquiryForm({ variant = "contact" }) {
  const [topic, setTopic] = useState(variant === "contact" ? "Basic inquiry" : "General");
  const [source, setSource] = useState("");
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "", term: "", content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("topic");
    const s = p.get("source") || "";
    const us = p.get("utm_source") || "";
    const um = p.get("utm_medium") || "";
    const uc = p.get("utm_campaign") || "";
    const ut = p.get("utm_term") || "";
    const uct = p.get("utm_content") || "";

    if (variant === "contact") {
      if (t === "licensing") setTopic("Interested in Licensing");
      else if (t === "call") setTopic("Schedule a Call");
      else if (t === "other") setTopic("Other");
      else if (t) setTopic(t); // Use the topic from URL if it matches one of our options
    } else {
      if (t === "oem") setTopic("OEM / ODM Licensing");
      else if (t === "custom_eng") setTopic("Custom Engineering");
    }

    setSource(s);
    setUtm({ source: us, medium: um, campaign: uc, term: ut, content: uct });
  }, [variant]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setSubmitted(true);
        // Redirect to thank you page with form data as URL parameters
        setTimeout(() => {
          const params = new URLSearchParams({
            topic: data.topic,
            source: data.source || 'Contact Form',
            utm_campaign: data.utm_campaign || '',
            utm_source: data.utm_source || '',
            utm_medium: data.utm_medium || ''
          });
          window.location.href = `/thank-you?${params.toString()}`;
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const topicOptions =
    variant === "contact"
      ? ["Basic inquiry", "Interested in Licensing", "Schedule a Call", "Other"]
      : ["General", "Software Licensing", "Hardware Licensing", "OEM / ODM Licensing", "Custom Engineering", "Branding/Trademark Permission"];

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-green-400 text-lg font-semibold mb-2">Message Sent Successfully!</div>
        <div className="text-gray-300">You will receive a confirmation shortly. Redirecting to thank you page...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 md:col-span-2 flex items-center justify-center">
        <span className="text-white font-semibold" style={{ fontSize: '1.6875rem' }}>Contact Us</span>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
        <label className="block mb-2 font-semibold text-gray-300">Full Name</label>
        <input name="name" required placeholder="Your name" className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500" />
      </div>
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
        <label className="block mb-2 font-semibold text-gray-300">Work Email</label>
        <input name="email" type="email" required placeholder="you@company.com" className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500" />
      </div>
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
        <label className="block mb-2 font-semibold text-gray-300">Company</label>
        <input name="company" placeholder="Organization" className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500" />
      </div>
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
        <label className="block mb-2 font-semibold text-gray-300">Topic</label>
        <select name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100">
          {topicOptions.map((o) => (
            <option key={o} className="bg-gray-900">{o}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 md:col-span-2">
        <label className="block mb-2 font-semibold text-gray-300">Message</label>
        <textarea name="message" rows="4" placeholder="Tell us a bit more…" className="w-full p-3 rounded-lg border border-gray-700 bg-gray-900 text-gray-100 placeholder-gray-500"></textarea>
      </div>

      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="utm_source" value={utm.source} />
      <input type="hidden" name="utm_medium" value={utm.medium} />
      <input type="hidden" name="utm_campaign" value={utm.campaign} />
      <input type="hidden" name="utm_term" value={utm.term} />
      <input type="hidden" name="utm_content" value={utm.content} />

      {error && (
        <div className="md:col-span-2 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 md:col-span-2 flex justify-end">
        <button 
          type="submit" 
          disabled={submitting}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-400 disabled:bg-gray-600 text-white font-semibold rounded-lg shadow"
        >
          {submitting ? "Sending..." : "Submit"}
        </button>
      </div>
    </form>
  );
}