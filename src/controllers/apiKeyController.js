import {
  createApiKey,
  listApiKeysByUser,
  getApiKeySecretByUser,
  revokeApiKey
} from '../services/apiKeyService.js';

export async function getApiKeys(req, res) {
  try {
    const keys = await listApiKeysByUser(req.user.id);

    return res.status(200).json({
      success: true,
      apiKeys: keys
    });
  } catch (error) {
    console.error('Get API keys error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve API keys.'
    });
  }
}

export async function getApiKeySecret(req, res) {
  try {
    const apiKey = await getApiKeySecretByUser({
      userId: req.user.id,
      keyId: req.params.keyId
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found or unavailable.'
      });
    }

    return res.status(200).json({
      success: true,
      apiKey
    });
  } catch (error) {
    console.error('Get API key secret error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve API key.'
    });
  }
}

export async function createKey(req, res) {
  try {
    const { companyName } = req.body || {};

    if (
      typeof companyName !== 'string' ||
      !companyName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required.'
      });
    }

    const apiKey = await createApiKey({
      userId: req.user.id,
      companyName
    });

    return res.status(201).json({
      success: true,
      message: 'API key created successfully.',
      apiKey
    });
  } catch (error) {
    console.error('Create API key error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to create API key.'
    });
  }
}

export async function revokeKey(req, res) {
  try {
    const { keyId } = req.params;

    if (!keyId) {
      return res.status(400).json({
        success: false,
        message: 'API key ID is required.'
      });
    }

    const revokedKey = await revokeApiKey({
      userId: req.user.id,
      keyId
    });

    if (!revokedKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'API key revoked successfully.',
      apiKey: revokedKey
    });
  } catch (error) {
    console.error('Revoke API key error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to revoke API key.'
    });
  }
}
