interface LogoutMessageProps {
  message: string
}

/**
 * Displays a message for when the user logs out of their account
 * @param root0
 * @param root0.message
 * @param root0
 * @param root0.message
 */
export default function LogoutMessage({ message }: LogoutMessageProps ) {
  return (
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center text-gray-700">{message}</div>
      </main>
  )
}
