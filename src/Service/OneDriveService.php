<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Service to upload files to OneDrive using Microsoft Graph API.
 */
class OneDriveService
{
    private ?string $accessToken = null;

    public function __construct(
        private HttpClientInterface $httpClient,
        private LoggerInterface $logger,
        private string $clientId,
        private string $clientSecret,
        private string $refreshToken,
        private string $folderPath = '/SupportTickets',
    ) {
    }

    /**
     * Upload a JSON file to OneDrive.
     */
    public function uploadJsonFile(string $filename, array $data): bool
    {
        try {
            $accessToken = $this->getAccessToken();
            
            $jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            
            $folderPath = '/' . ltrim($this->folderPath, '/');
            
            $uploadUrl = sprintf(
                'https://graph.microsoft.com/v1.0/me/drive/root:%s/%s:/content',
                $folderPath,
                $filename
            );
            
            $response = $this->httpClient->request('PUT', $uploadUrl, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'body' => $jsonContent,
            ]);
            
            $statusCode = $response->getStatusCode();
            
            if ($statusCode >= 200 && $statusCode < 300) {
                $this->logger->info('File uploaded to OneDrive', [
                    'filename' => $filename,
                    'folder' => $folderPath,
                ]);
                return true;
            }
            
            $this->logger->error('OneDrive upload failed', [
                'status' => $statusCode,
                'response' => $response->getContent(false),
            ]);
            return false;
            
        } catch (\Exception $e) {
            $this->logger->error('OneDrive upload error', [
                'error' => $e->getMessage(),
                'filename' => $filename,
            ]);
            throw new \RuntimeException('Failed to upload file to OneDrive: ' . $e->getMessage());
        }
    }

    /**
     * Get a valid access token, refreshing if necessary.
     */
    private function getAccessToken(): string
    {
        if ($this->accessToken) {
            return $this->accessToken;
        }

        try {
            $response = $this->httpClient->request('POST', 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token', [
                'body' => [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'refresh_token' => $this->refreshToken,
                    'grant_type' => 'refresh_token',
                    'scope' => 'Files.ReadWrite offline_access',
                ],
            ]);

            $data = $response->toArray();
            $this->accessToken = $data['access_token'];
            
            $this->logger->debug('OneDrive access token refreshed');
            
            return $this->accessToken;
            
        } catch (\Exception $e) {
            $this->logger->error('Failed to refresh OneDrive token', [
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Failed to authenticate with OneDrive: ' . $e->getMessage());
        }
    }
}
