export class APIError extends Error {

    title: string;
    status: number;
    data?: unknown;

    constructor(title: string, message: string, status = 500, data?: unknown) {
        super();

        this.name = "APIError";

        this.title = title;
        this.message = message;
        this.status = status;
        this.data = data;

        Object.setPrototypeOf(this, new.target.prototype);
  }

    static errorUserAlreadyExists(): APIError {
        return new APIError("User mit dem Usernamen existiert bereits.", "Verwende einen anderen Usernamen.", 409);
    }

    static errorUnauthorized(data?: unknown): APIError {
        return new APIError("Diese Ressource ist geschützt.", "Bitte melde dich an.", 401, data);
    }

    static errorForbidden(data?: unknown): APIError {
        return new APIError("Diese Ressource ist geschützt.", "Du besitzt nicht die nötigen Rechte.", 403, data);
    }

    static errorSessionExpired(data?: unknown): APIError {
        return new APIError("Die Session ist abgelaufen.", "Bitte melde dich erneut an.", 403, data);
    }

    static errorNotFound(data?: unknown): APIError {
        return new APIError("Diese Ressource existiert nicht (mehr).", "Bitte prüfe die Abfrage.", 404, data);
    }

    static errorInvalidInput(data?: unknown): APIError {
        return new APIError("Der Body enthält unbekannte Parameter.", "Bitte überprüfe den Body der Anfrage.", 422, data);
    }

    static errorUnknown(data?: unknown): APIError {
        return new APIError("Unbekannter Fehler aufgetreten.", "Bitte probiere es erneut oder wende dich an den Support", 500, data);
    }

    static errorUnsafePassword(data?: unknown): APIError {
        return new APIError("Passwort zu schwach.", "Bitte beachte die Passwortregeln: min. zwölf Zeichen und mindestens drei der folgenden Kategorien: Klein-, Großbuchstaben, Zahlen oder Sonderzeichen.", 422, data);
    }

    static errorWrongLoginCredentials(data?: unknown): APIError {
        return new APIError("Falsche Logindaten.", "Die Emailadresse und/oder das Passwort stimmt nicht.", 422, data);
    }

    static errorIsDeactivated(data?: unknown): APIError {
        return new APIError("Account gesperrt.", "Dieser Account ist gesperrt. Prüfe bitte dein Postfach: Ein Entsperrungslink wurde bereits versendet.", 422, data);
    }

    static errorGone(data?: unknown): APIError {
        return new APIError("Veraltete Version.", "Diese API-Route ist veraltet. Bitte überprüfe die Dokumentation und deine Anfrage.", 410, data);
    }

    static errorTooManyFailedLoginTries(data?: unknown): APIError {
        return new APIError("Zu viele fehlgeschlagene Anmeldeversuche.", "Dein Konto wurde gesperrt!.", 429, data);
    }
}
