export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            EduGuard's commitment to protecting student privacy and data security in our dropout prevention system
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="p-8 lg:p-12">
            <div className="prose prose-lg max-w-none">
              
              {/* Introduction */}
              <section className="mb-12">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg mb-8">
                  <h2 className="text-2xl font-bold text-blue-900 mb-3">Our Commitment</h2>
                  <p className="text-blue-800 text-lg leading-relaxed">
                    EduGuard is deeply committed to protecting the privacy and security of student data. 
                    We understand the sensitive nature of educational information and have implemented 
                    comprehensive measures to ensure data protection in our dropout prevention system.
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-600 font-bold">1</span>
                  </div>
                  Information We Collect
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-green-900 mb-4">Academic Information</h3>
                    <ul className="text-green-800 space-y-2">
                      <li>• Academic performance records</li>
                      <li>• Attendance patterns and history</li>
                      <li>• Grade progression and trends</li>
                      <li>• Subject-specific performance data</li>
                      <li>• Assessment results and evaluations</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Personal Information</h3>
                    <ul className="text-blue-800 space-y-2">
                      <li>• Student identification details</li>
                      <li>• Contact information</li>
                      <li>• Family and guardian details</li>
                      <li>• Socio-economic background</li>
                      <li>• Health and special needs information</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-4">Risk Assessment Data</h3>
                  <p className="text-yellow-800 mb-4">
                    We collect specific information to identify students at risk of dropping out, including:
                  </p>
                  <ul className="text-yellow-800 space-y-2">
                    <li>• Family situation and support systems</li>
                    <li>• Economic circumstances (Ubudehe level)</li>
                    <li>• Behavioral patterns and engagement</li>
                    <li>• Social and emotional indicators</li>
                    <li>• Intervention history and outcomes</li>
                  </ul>
                </div>
              </section>

              {/* How We Use Information */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  How We Use Your Information
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-purple-50 p-6 rounded-lg text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-3">Early Detection</h3>
                    <p className="text-purple-800 text-sm">
                      Identify students at risk of dropping out through advanced analytics and pattern recognition.
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50 p-6 rounded-lg text-center">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-indigo-900 mb-3">Intervention Support</h3>
                    <p className="text-indigo-800 text-sm">
                      Provide targeted support and resources to help students succeed and stay in school.
                    </p>
                  </div>
                  
                  <div className="bg-pink-50 p-6 rounded-lg text-center">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-pink-900 mb-3">Parent Communication</h3>
                    <p className="text-pink-800 text-sm">
                      Keep parents informed about their child's progress and any concerns that arise.
                    </p>
                  </div>
                </div>
              </section>

              {/* Data Protection */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-red-600 font-bold">3</span>
                  </div>
                  Data Protection & Security
                </h2>
                
                <div className="bg-red-50 border border-red-200 p-8 rounded-lg mb-8">
                  <h3 className="text-2xl font-bold text-red-900 mb-6">Security Measures</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-red-800 mb-3">Technical Safeguards</h4>
                      <ul className="text-red-700 space-y-2">
                        <li>• End-to-end encryption for all data transmission</li>
                        <li>• Secure cloud storage with multi-factor authentication</li>
                        <li>• Regular security audits and penetration testing</li>
                        <li>• Automated backup and disaster recovery systems</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-800 mb-3">Access Controls</h4>
                      <ul className="text-red-700 space-y-2">
                        <li>• Role-based access permissions</li>
                        <li>• Audit logs for all data access</li>
                        <li>• Regular access reviews and updates</li>
                        <li>• Secure authentication protocols</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Compliance & Standards</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">GDPR</div>
                      <div className="text-sm text-gray-600">General Data Protection Regulation</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">FERPA</div>
                      <div className="text-sm text-gray-600">Family Educational Rights and Privacy Act</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-2">COPPA</div>
                      <div className="text-sm text-gray-600">Children's Online Privacy Protection Act</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Sharing */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-orange-600 font-bold">4</span>
                  </div>
                  Data Sharing & Third Parties
                </h2>
                
                <div className="bg-orange-50 p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-semibold text-orange-900 mb-4">We Do NOT Share Data With:</h3>
                  <ul className="text-orange-800 space-y-2">
                    <li>• Marketing companies or advertisers</li>
                    <li>• Social media platforms</li>
                    <li>• Third-party analytics services</li>
                    <li>• Commercial data brokers</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-green-900 mb-4">Limited Sharing Only With:</h3>
                  <ul className="text-green-800 space-y-2">
                    <li>• Authorized school personnel (teachers, counselors, administrators)</li>
                    <li>• Parents and legal guardians (for their own children)</li>
                    <li>• Educational authorities (when required by law)</li>
                    <li>• Emergency services (in case of safety concerns)</li>
                  </ul>
                </div>
              </section>

              {/* Student Rights */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-teal-600 font-bold">5</span>
                  </div>
                  Student & Parent Rights
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-teal-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-teal-900 mb-4">Access Rights</h3>
                    <ul className="text-teal-800 space-y-2">
                      <li>• View all data collected about your child</li>
                      <li>• Request copies of educational records</li>
                      <li>• Understand how data is being used</li>
                      <li>• Access risk assessment reports</li>
                    </ul>
                  </div>
                  
                  <div className="bg-cyan-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-cyan-900 mb-4">Control Rights</h3>
                    <ul className="text-cyan-800 space-y-2">
                      <li>• Request data corrections or updates</li>
                      <li>• Opt-out of certain data collection</li>
                      <li>• Request data deletion (where legally permissible)</li>
                      <li>• Control notification preferences</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">6</span>
                  </div>
                  Contact Us
                </h2>
                
                <div className="bg-blue-50 p-8 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold text-blue-900 mb-4">Privacy Questions</h3>
                      <div className="space-y-3 text-blue-800">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>privacy@eduguard.rw</span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>+250 788 000 000</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-blue-900 mb-4">School Administration</h3>
                      <p className="text-blue-800 mb-4">
                        For immediate concerns about your child's data, contact your school's administration office.
                      </p>
                      <div className="text-sm text-blue-700">
                        <p>Data Protection Officer</p>
                        <p>EduGuard System</p>
                        <p>Kigali, Rwanda</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="border-t border-gray-200 pt-8 mt-12">
                <div className="text-center text-gray-500">
                  <p className="mb-2">
                    This privacy policy is effective as of {new Date().toLocaleDateString()} and will be updated as needed.
                  </p>
                  <p className="text-sm">
                    EduGuard is committed to maintaining the highest standards of data protection and privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
