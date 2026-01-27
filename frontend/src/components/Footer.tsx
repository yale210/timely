export default function Footer() {
    return (
        <div className="text-center" data-testid="footer">
            <p className="text-gray-500 p-4 text-sm" data-testid="footer-content">
                &copy; Timely {new Date().getFullYear()}
            </p>
        </div>
    )
}