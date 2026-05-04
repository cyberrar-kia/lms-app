export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-sm border border-gray-100">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold mb-3">Account Under Review</h2>
        <p className="text-gray-500">Your account is being reviewed. You'll receive an email once you're approved. This usually takes less than 24 hours.</p>
        <a href="/login" className="inline-block mt-6 text-brand text-sm hover:underline">← Back to login</a>
      </div>
    </div>
  );
}
