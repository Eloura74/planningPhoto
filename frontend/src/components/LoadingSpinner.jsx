function LoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center min-h-screen fade-in"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 border-4 rounded-full spinner"
          style={{
            borderColor: "var(--chrome-medium)",
            borderTopColor: "var(--gold-primary)",
          }}
        ></div>
        <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
          Chargement...
        </p>
      </div>
    </div>
  );
}

export default LoadingSpinner;
