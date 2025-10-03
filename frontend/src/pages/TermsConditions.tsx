import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export function TermsConditions() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ShieldCheckIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Terms & Conditions</h1>
          <p className="mt-2 text-neutral-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>EduGuard Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Acceptance of Terms</h2>
                <p className="text-neutral-700">
                  By accessing and using EduGuard, you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not 
                  use this service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. Description of Service</h2>
                <p className="text-neutral-700 mb-4">
                  EduGuard is a proactive dropout prevention system designed for educational institutions 
                  in Rwanda. The service includes:
                </p>
                <ul className="list-disc list-inside text-neutral-700 space-y-2">
                  <li>Student progress monitoring and analytics</li>
                  <li>Risk assessment and early warning systems</li>
                  <li>Communication tools for teachers and administrators</li>
                  <li>Reporting and intervention management</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. User Accounts and Responsibilities</h2>
                <p className="text-neutral-700 mb-4">
                  To use our service, you must:
                </p>
                <ul className="list-disc list-inside text-neutral-700 space-y-2">
                  <li>Provide accurate and complete information during registration</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Use the service only for legitimate educational purposes</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Respect the privacy and rights of other users</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Prohibited Uses</h2>
                <p className="text-neutral-700 mb-4">
                  You may not use our service:
                </p>
                <ul className="list-disc list-inside text-neutral-700 space-y-2">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                  <li>To upload or transmit viruses or any other type of malicious code</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Data Protection and Privacy</h2>
                <p className="text-neutral-700 mb-4">
                  We are committed to protecting your privacy and personal information. Our collection, 
                  use, and disclosure of personal information is governed by our Privacy Policy, which 
                  is incorporated into these Terms by reference.
                </p>
                <p className="text-neutral-700">
                  Student data is collected and used solely for educational purposes and in compliance 
                  with applicable educational privacy laws and regulations in Rwanda.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Intellectual Property Rights</h2>
                <p className="text-neutral-700 mb-4">
                  The service and its original content, features, and functionality are and will remain 
                  the exclusive property of EduGuard and its licensors. The service is protected by 
                  copyright, trademark, and other laws.
                </p>
                <p className="text-neutral-700">
                  You may not reproduce, distribute, modify, create derivative works of, publicly display, 
                  publicly perform, republish, download, store, or transmit any of our material without 
                  our prior written consent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Service Availability</h2>
                <p className="text-neutral-700">
                  We strive to provide continuous service availability, but we do not guarantee that our 
                  service will be uninterrupted or error-free. We reserve the right to modify, suspend, 
                  or discontinue the service at any time without notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">8. Limitation of Liability</h2>
                <p className="text-neutral-700">
                  In no event shall EduGuard, nor its directors, employees, partners, agents, suppliers, 
                  or affiliates, be liable for any indirect, incidental, special, consequential, or 
                  punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                  or other intangible losses, resulting from your use of the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">9. Indemnification</h2>
                <p className="text-neutral-700">
                  You agree to defend, indemnify, and hold harmless EduGuard and its licensee and 
                  licensors, and their employees, contractors, agents, officers and directors, from and 
                  against any and all claims, damages, obligations, losses, liabilities, costs or debt, 
                  and expenses (including but not limited to attorney's fees).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">10. Termination</h2>
                <p className="text-neutral-700 mb-4">
                  We may terminate or suspend your account and bar access to the service immediately, 
                  without prior notice or liability, under our sole discretion, for any reason whatsoever 
                  and without limitation, including but not limited to a breach of the Terms.
                </p>
                <p className="text-neutral-700">
                  If you wish to terminate your account, you may simply discontinue using the service 
                  or contact us to request account deletion.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">11. Governing Law</h2>
                <p className="text-neutral-700">
                  These Terms shall be interpreted and governed by the laws of Rwanda, without regard 
                  to its conflict of law provisions. Our failure to enforce any right or provision of 
                  these Terms will not be considered a waiver of those rights.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">12. Changes to Terms</h2>
                <p className="text-neutral-700">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any 
                  time. If a revision is material, we will provide at least 30 days notice prior to any 
                  new terms taking effect.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">13. Contact Information</h2>
                <p className="text-neutral-700">
                  If you have any questions about these Terms & Conditions, please contact us:
                </p>
                <div className="mt-4 p-4 bg-neutral-100 rounded-lg">
                  <p className="text-neutral-700">
                    <strong>Email:</strong> legal@eduguard.rw<br />
                    <strong>Phone:</strong> +250 788 123 456<br />
                    <strong>Address:</strong> Kigali, Rwanda
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link 
            to="/auth/register" 
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            ← Back to Registration
          </Link>
        </div>
      </div>
    </div>
  )
}
