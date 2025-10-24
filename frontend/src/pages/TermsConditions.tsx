export function TermsConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Terms of service for EduGuard dropout prevention system and educational data management platform
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
                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg mb-8">
                  <h2 className="text-2xl font-bold text-green-900 mb-3">Agreement to Terms</h2>
                  <p className="text-green-800 text-lg leading-relaxed">
                    Welcome to EduGuard, the comprehensive dropout prevention system for educational institutions in Rwanda. 
                    By accessing and using this platform, you agree to be bound by these Terms and Conditions. 
                    Please read them carefully before using our services.
                  </p>
                </div>
              </section>

              {/* System Overview */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  System Overview & Purpose
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Primary Objectives</h3>
                    <ul className="text-blue-800 space-y-2">
                      <li>• Early identification of at-risk students</li>
                      <li>• Proactive intervention and support</li>
                      <li>• Academic performance monitoring</li>
                      <li>• Parent and guardian communication</li>
                      <li>• Educational outcome improvement</li>
                </ul>
                  </div>
                  
                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-indigo-900 mb-4">Authorized Users</h3>
                    <ul className="text-indigo-800 space-y-2">
                      <li>• School administrators and principals</li>
                      <li>• Teachers and educational staff</li>
                      <li>• Counselors and support personnel</li>
                      <li>• Authorized district officials</li>
                      <li>• Parents and legal guardians</li>
                </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-4">System Capabilities</h3>
                  <p className="text-yellow-800 mb-4">
                    EduGuard provides comprehensive tools for educational institutions to:
                  </p>
                  <ul className="text-yellow-800 space-y-2">
                    <li>• Monitor student attendance and academic performance</li>
                    <li>• Analyze socio-economic risk factors</li>
                    <li>• Generate automated alerts and notifications</li>
                    <li>• Track intervention effectiveness</li>
                    <li>• Maintain detailed student records</li>
                </ul>
                </div>
              </section>

              {/* User Responsibilities */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  User Responsibilities & Conduct
                </h2>
                
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-purple-50 p-6 rounded-lg text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-3">Data Confidentiality</h3>
                    <p className="text-purple-800 text-sm">
                      Maintain strict confidentiality of all student information and educational records.
                    </p>
                  </div>
                  
                  <div className="bg-pink-50 p-6 rounded-lg text-center">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-pink-900 mb-3">Appropriate Use</h3>
                    <p className="text-pink-800 text-sm">
                      Use the system only for legitimate educational purposes and student support.
                    </p>
                  </div>
                  
                  <div className="bg-teal-50 p-6 rounded-lg text-center">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-teal-900 mb-3">Professional Standards</h3>
                    <p className="text-teal-800 text-sm">
                      Maintain professional conduct and follow educational best practices.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-red-900 mb-4">Prohibited Activities</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-red-800 mb-3">Unauthorized Access</h4>
                      <ul className="text-red-700 space-y-1 text-sm">
                        <li>• Accessing accounts without authorization</li>
                        <li>• Sharing login credentials</li>
                        <li>• Attempting to bypass security measures</li>
                        <li>• Unauthorized data extraction</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-800 mb-3">Misuse of Data</h4>
                      <ul className="text-red-700 space-y-1 text-sm">
                        <li>• Using data for non-educational purposes</li>
                        <li>• Sharing information with unauthorized parties</li>
                        <li>• Modifying data without proper authority</li>
                        <li>• Discriminating based on student data</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Management */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-orange-600 font-bold">3</span>
                  </div>
                  Data Management & Privacy
                </h2>
                
                <div className="bg-orange-50 p-8 rounded-lg mb-8">
                  <h3 className="text-2xl font-bold text-orange-900 mb-6">Data Collection & Usage</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-orange-800 mb-3">Information We Collect</h4>
                      <ul className="text-orange-700 space-y-2">
                        <li>• Student academic records and performance</li>
                        <li>• Attendance and behavioral data</li>
                        <li>• Family and socio-economic information</li>
                        <li>• Contact details for communication</li>
                        <li>• Risk assessment indicators</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-orange-800 mb-3">How We Use Data</h4>
                      <ul className="text-orange-700 space-y-2">
                        <li>• Identify students at risk of dropout</li>
                        <li>• Provide targeted interventions</li>
                        <li>• Communicate with parents and guardians</li>
                        <li>• Generate reports and analytics</li>
                        <li>• Improve educational outcomes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Protection Standards</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-2">Encryption</div>
                      <div className="text-sm text-gray-600">All data encrypted in transit and at rest</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">Access Control</div>
                      <div className="text-sm text-gray-600">Role-based permissions and authentication</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-2">Audit Logs</div>
                      <div className="text-sm text-gray-600">Complete activity tracking and monitoring</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Compliance & Legal */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-indigo-600 font-bold">4</span>
                  </div>
                  Legal Compliance & Regulations
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-indigo-900 mb-4">Rwandan Education Law</h3>
                    <ul className="text-indigo-800 space-y-2">
                      <li>• Education Sector Strategic Plan compliance</li>
                      <li>• Student data protection regulations</li>
                      <li>• Educational privacy requirements</li>
                      <li>• Ministry of Education guidelines</li>
                    </ul>
                  </div>
                  
                  <div className="bg-cyan-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-cyan-900 mb-4">International Standards</h3>
                    <ul className="text-cyan-800 space-y-2">
                      <li>• GDPR compliance for data protection</li>
                      <li>• FERPA standards for educational records</li>
                      <li>• COPPA requirements for children's privacy</li>
                      <li>• ISO 27001 security standards</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-4">Reporting Requirements</h3>
                  <p className="text-yellow-800 mb-4">
                    Users must comply with all reporting requirements and maintain accurate records as required by:
                  </p>
                  <ul className="text-yellow-800 space-y-2">
                    <li>• Ministry of Education reporting standards</li>
                    <li>• District education office requirements</li>
                    <li>• School board policies and procedures</li>
                    <li>• National education statistics collection</li>
                  </ul>
                </div>
              </section>

              {/* System Availability */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-emerald-600 font-bold">5</span>
                  </div>
                  System Availability & Support
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-emerald-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-emerald-900 mb-4">Service Availability</h3>
                    <ul className="text-emerald-800 space-y-2">
                      <li>• 99.9% uptime target for critical functions</li>
                      <li>• Scheduled maintenance windows</li>
                      <li>• Emergency maintenance procedures</li>
                      <li>• Backup and disaster recovery</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Technical Support</h3>
                    <ul className="text-blue-800 space-y-2">
                      <li>• 24/7 technical support availability</li>
                      <li>• Training and documentation resources</li>
                      <li>• Regular system updates and improvements</li>
                      <li>• User feedback and feature requests</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Liability & Disclaimers */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-red-600 font-bold">6</span>
                  </div>
                  Liability & Disclaimers
                </h2>
                
                <div className="bg-red-50 border border-red-200 p-8 rounded-lg mb-8">
                  <h3 className="text-2xl font-bold text-red-900 mb-6">Limitation of Liability</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-red-800 mb-3">System Limitations</h4>
                      <ul className="text-red-700 space-y-2">
                        <li>• EduGuard is a tool to support decision-making</li>
                        <li>• Human judgment remains essential</li>
                        <li>• System recommendations are advisory</li>
                        <li>• Final decisions rest with authorized personnel</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-800 mb-3">User Responsibility</h4>
                      <ul className="text-red-700 space-y-2">
                        <li>• Users responsible for data accuracy</li>
                        <li>• Proper training and system understanding required</li>
                        <li>• Compliance with all applicable laws</li>
                        <li>• Professional judgment in all decisions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Disclaimer</h3>
                  <p className="text-gray-700 mb-4">
                    EduGuard provides educational support tools and analytics. While we strive for accuracy and reliability, 
                    the system is not a substitute for professional educational judgment. Users must exercise appropriate 
                    care and professional judgment in all educational decisions.
                  </p>
                  <p className="text-gray-700">
                    EduGuard shall not be liable for any direct, indirect, incidental, or consequential damages 
                    arising from the use of this system.
                  </p>
                </div>
              </section>

              {/* Termination */}
              <section className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-gray-600 font-bold">7</span>
                  </div>
                  Account Termination & Data Retention
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Termination</h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• Accounts may be terminated for policy violations</li>
                      <li>• 30-day notice for service discontinuation</li>
                      <li>• Data export options before termination</li>
                      <li>• Secure data deletion procedures</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Data Retention</h3>
                    <ul className="text-blue-800 space-y-2">
                      <li>• Student records retained per legal requirements</li>
                      <li>• Graduation or transfer data handling</li>
                      <li>• Archive and backup procedures</li>
                      <li>• Secure disposal of outdated records</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-600 font-bold">8</span>
                  </div>
                  Contact & Support
                </h2>
                
                <div className="bg-green-50 p-8 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xl font-semibold text-green-900 mb-4">Technical Support</h3>
                      <div className="space-y-3 text-green-800">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>support@eduguard.rw</span>
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
                      <h3 className="text-xl font-semibold text-green-900 mb-4">Legal & Compliance</h3>
                      <p className="text-green-800 mb-4">
                        For legal questions, compliance issues, or terms of service inquiries.
                      </p>
                      <div className="text-sm text-green-700">
                        <p>Legal Department</p>
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
                    These terms and conditions are effective as of {new Date().toLocaleDateString()} and may be updated periodically.
                  </p>
                  <p className="text-sm">
                    By using EduGuard, you acknowledge that you have read, understood, and agree to be bound by these terms.
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
