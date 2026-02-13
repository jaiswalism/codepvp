import { useUser } from "../../../hooks/useUser";

export function Languages() {
  const { userData, loading } = useUser();
  const languages = userData?.languages || [];

  if (loading) {
    return (
      <div className="gaming-border gaming-glow bg-card rounded-lg">
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="gaming-border gaming-glow bg-card rounded-lg">
      <div className="p-4">
        <h3 className="text-lg text-foreground font-semibold mb-4">Languages</h3>
      </div>
      <div className="px-4 pb-4 space-y-3">
        {languages.length > 0 ? (
          languages.map((lang, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm bg-transparent backdrop-blur-sm p-2 text-foreground">{lang}</span>
              
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">
            No languages selected yet
          </p>
        )}
      </div>
    </div>
  );
}
