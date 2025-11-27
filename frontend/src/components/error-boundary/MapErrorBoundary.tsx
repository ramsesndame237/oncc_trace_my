"use client";

import { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary spécifique pour les composants de carte
 * Empêche qu'une erreur dans Leaflet ne fasse crasher toute l'application
 */
export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("❌ Erreur capturée par MapErrorBoundary:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback par défaut
      return (
        <div className="h-96 bg-destructive/10 border border-destructive rounded-lg flex flex-col items-center justify-center p-6">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Erreur d&apos;affichage de la carte
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            Une erreur s&apos;est produite lors du chargement de la carte. Cela peut
            être dû à des coordonnées invalides ou à un problème de connexion.
          </p>
          {this.state.error && (
            <p className="text-xs text-muted-foreground mb-4 font-mono">
              {this.state.error.message}
            </p>
          )}
          <Button onClick={this.handleReset} variant="outline" size="sm">
            Réessayer
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
