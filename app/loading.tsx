import Image from 'next/image';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <Image 
            src="/mailerlogo-removebg.png" 
            alt="Payslip Mailer Logo" 
            width={120} 
            height={120}
            className="mx-auto animate-spin"
            priority
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
