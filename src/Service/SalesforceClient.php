<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class SalesforceClient
{
    private ?string $accessToken = null;
    private ?string $instanceUrl = null;

    public function __construct(
        private HttpClientInterface $httpClient,
        private LoggerInterface $logger,
        #[Autowire(env: 'SALESFORCE_CLIENT_ID')]
        private string $clientId,
        #[Autowire(env: 'SALESFORCE_CLIENT_SECRET')]
        private string $clientSecret,
        #[Autowire(env: 'SALESFORCE_INSTANCE_URL')]
        private string $loginUrl = 'https://login.salesforce.com' 
    ) {
    }

    /**
     * Authenticate with Salesforce and get Access Token
     */
    private function authenticate(): void
    {
        if ($this->accessToken) {
            return;
        }

        try {
            $response = $this->httpClient->request('POST', rtrim($this->loginUrl, '/') . '/services/oauth2/token', [
                'body' => [
                    'grant_type' => 'client_credentials',
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                ],
            ]);

            $data = $response->toArray(); // Throws on 300-599
            
            $this->accessToken = $data['access_token'];
            $this->instanceUrl = $data['instance_url'];
            
            $this->logger->info('Salesforce authentication successful', ['instance' => $this->instanceUrl]);

        } catch (ClientExceptionInterface $e) {
            $content = $e->getResponse()->getContent(false);
            $errorMsg = $e->getMessage();
            
            try {
                $json = json_decode($content, true);
                if (isset($json['error_description'])) {
                    $errorMsg = $json['error_description'];
                } elseif (isset($json['error'])) {
                    $errorMsg = $json['error'];
                } elseif (is_array($json) && isset($json[0]['message'])) {
                    $errorMsg = $json[0]['message'];
                }
            } catch (\Exception $decodeError) {
                // Keep original message if JSON decode fails
            }

            $this->logger->error('Salesforce authentication failed', [
                'error' => $errorMsg,
                'response' => $content
            ]);
            
            throw new \RuntimeException('Salesforce Auth Error: ' . $errorMsg);

        } catch (\Exception $e) {
            $this->logger->error('Salesforce authentication failed', ['error' => $e->getMessage()]);
            throw new \RuntimeException('Failed to authenticate with Salesforce: ' . $e->getMessage());
        }
    }

    /**
     * Create an Account (Company)
     */
    public function createAccount(string $companyName): string
    {
        $this->authenticate();

        $response = $this->httpClient->request('POST', $this->instanceUrl . '/services/data/v60.0/sobjects/Account', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'Name' => $companyName,
            ],
        ]);

        $data = $response->toArray();
        if (!$data['success']) {
            throw new \RuntimeException('Salesforce Account creation returned failure status.');
        }

        return $data['id'];
    }

    /**
     * Create a Contact linked to an Account
     */
    public function createContact(
        string $firstName,
        string $lastName,
        string $email,
        string $accountId,
        ?string $phone = null,
        ?string $title = null
    ): string {
        $this->authenticate();

        $payload = [
            'FirstName' => $firstName,
            'LastName' => $lastName,
            'Email' => $email,
            'AccountId' => $accountId,
        ];

        if ($phone) $payload['Phone'] = $phone;
        if ($title) $payload['Title'] = $title;

        $response = $this->httpClient->request('POST', $this->instanceUrl . '/services/data/v60.0/sobjects/Contact', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ],
            'json' => $payload,
        ]);

        $data = $response->toArray();
        if (!$data['success']) {
            throw new \RuntimeException('Salesforce Contact creation returned failure status.');
        }

        return $data['id'];
    }
}
