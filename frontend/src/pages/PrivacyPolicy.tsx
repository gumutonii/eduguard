import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ShieldCheckIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">Privacy Policy</h1>
          <p className="mt-2 text-neutral-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>EduGuard Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-neutral max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">1. Information We Collect</h2>
                <p className="text-neutral-700 mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  use our services, or contact us for support.
                </p>
                <ul className="list-disc list-inside text-neutral-700 space-y-2">
                  <li>Personal information (name, email address, phone number)</li>
                  <li>School and role information</li>
                  <li>Student data (for educational purposes only)</li>
                  <li>Usage data and analytics</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">2. How We Use Your Information</h2>
                <p className="text-neutral-700 mb-4">
                  We use the information we collect to provide, maintain, and improve our services:
                </p>
                <ul className="list-disc list-inside text-neutral-700 space-y-2">
                  <li>Provide educational services and student monitoring</li>
                  <li>Send important notifications and updates</li>
                  <li>Improve our platform and develop new features</li>
                  <li>Ensure platform security and prevent fraud</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">3. Information Sharing</h2>
                <p className="text-neutral-700 mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties 
                  without your consent, except in the following circumstances:
                </p>
                <ul className="list-disc list-inside text-neutral-700 space-y-2">
                  <li>With your school administration (for educational purposes)</li>
                  <li>When required by law or legal process</li>
                  <li>To protect our rights and the safety of our users</li>
                  <li>With service providers who assist in our operations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">4. Data Security</h2>
                <p className="text-neutral-700 mb-4">
                  We implement appropriate security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction.
                </p>
                <ul className="list-disc list-inside text-neutral-700 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Secure data storage and backup procedures</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">5. Your Rights</h2>
                <p className="text-neutral-700 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-neutral-700 space-y-2">
                  <li>Access and update your personal information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt-out of certain communications</li>
                  <li>Request a copy of your data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">6. Children's Privacy</h2>
                <p className="text-neutral-700">
                  Our service is designed for educational institutions and their authorized users. 
                  We do not knowingly collect personal information from children under 13 without 
                  appropriate consent. Student data is collected and used solely for educational purposes 
                  and in compliance with applicable educational privacy laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">7. Changes to This Policy</h2>
                <p className="text-neutral-700">
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new Privacy Policy on this page and updating the "Last updated" 
                  date. Your continued use of our service after any changes constitutes acceptance of 
                  the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">8. Contact Us</h2>
                <p className="text-neutral-700">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-neutral-100 rounded-lg">
                  <p className="text-neutral-700">
                    <strong>Email:</strong> privacy@eduguard.rw<br />
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
