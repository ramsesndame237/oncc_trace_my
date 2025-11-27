import { User } from "@/core/domain/user.types";
import { useCallback, useEffect, useState } from "react";
import { UserServiceProvider } from "../../infrastructure/di/userServiceProvider";

export function useGetUserById(id: string, isOnline = true) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserByIdUseCase = UserServiceProvider.getGetUserByIdUseCase();

  const fetchUser = useCallback(async () => {
    if (!id || id.trim() === "") {
      setIsLoading(false);
      setError("ID utilisateur invalide");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedUser = await getUserByIdUseCase.execute(id, isOnline);
      setUser(fetchedUser);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la récupération de l'utilisateur"
      );
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, isOnline, getUserByIdUseCase]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
  };
}
