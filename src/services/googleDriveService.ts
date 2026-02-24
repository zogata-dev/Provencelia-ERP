
// SEM VLOŽTE SVÉ NOVÉ CLIENT ID, KTERÉ VYGENERUJETE V GOOGLE CONSOLE
const CLIENT_ID = '381438079625-8akca5gf7nja3o5h627le7jmiqdbue63.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets';

let tokenClient: any = null;

/**
 * Inicializuje Google OAuth2 klienta. 
 */
export const initGoogleAuth = (onTokenReceived: (token: string) => void) => {
  const checkGoogle = () => {
    if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.oauth2) {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error !== undefined) {
            console.error('OAuth Error:', response.error);
            throw response;
          }
          // Save token and expiration (typically 3600 seconds)
          const expiresAt = Date.now() + (response.expires_in * 1000);
          localStorage.setItem('google_access_token', response.access_token);
          localStorage.setItem('google_token_expires', expiresAt.toString());
          
          onTokenReceived(response.access_token);
        },
      });
      console.log('Google Auth Initialized');

      // Check if we already have a valid token saved
      const savedToken = localStorage.getItem('google_access_token');
      const expiresAt = localStorage.getItem('google_token_expires');
      if (savedToken && expiresAt && Date.now() < parseInt(expiresAt, 10)) {
        console.log('Using saved Google Access Token');
        onTokenReceived(savedToken);
      }
    } else {
      setTimeout(checkGoogle, 200);
    }
  };

  checkGoogle();
};

export const requestAccessToken = () => {
  if (tokenClient) {
    try {
      // Use prompt: '' to try silent auth if they've already consented before, 
      // but if it fails or requires interaction, it will show the popup.
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      console.error('Failed to request access token:', err);
    }
  } else {
    alert('Google login se stále inicializuje. Pokud toto vidíte déle než 5 sekund, zkontrolujte CLIENT_ID.');
  }
};

/**
 * Stáhne binární data souboru a převede je na base64.
 */
export const fetchFileBase64 = async (fileId: string, accessToken: string): Promise<string> => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  if (!response.ok) throw new Error(`Failed to download file: ${response.status}`);
  
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const fetchDriveFilesRecursive = async (folderId: string, accessToken: string): Promise<any[]> => {
  const allFiles: any[] = [];

  const crawl = async (currentFolderId: string, path: string = 'Root') => {
    try {
      const filesResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${currentFolderId}'+in+parents+and+mimeType='application/pdf'+and+trashed=false&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (!filesResponse.ok) throw new Error(`Drive API error: ${filesResponse.status}`);

      const filesData = await filesResponse.json();
      if (filesData.files) {
        filesData.files.forEach((f: any) => allFiles.push({ ...f, path }));
      }

      const foldersResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${currentFolderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      const foldersData = await foldersResponse.json();
      if (foldersData.files) {
        for (const folder of foldersData.files) {
          await crawl(folder.id, `${path}/${folder.name}`);
        }
      }
    } catch (error) {
      console.error(`Error crawling folder ${currentFolderId}:`, error);
    }
  };

  await crawl(folderId);
  return allFiles;
};
