import axios from 'axios';

interface PhoenixCertificate {
  CertNo: string;
  CalibrationStatus?: string;
  CalibrationResult?: string;
  Manufacturer?: string;
  Model?: string;
  EquipmentType?: string;
  CalDate?: string;
  DueDate?: string;
  CustomerRequirements?: string[];
  Datasheet?: Array<{Group: string, Measurements: any[]}>;
  AccreditationInfo?: string;
  AssetNo?: string;
  CustomerCode?: string;
  EquipmentLocation?: string;
  OperatingRange?: string;
  Remarks?: string;
  LastModified?: string;
  [key: string]: unknown;
}

interface PhoenixPendingCertificate {
  CertNo: string;
  LastModified: string;
}

interface SupabaseCertificate {
  cert_no: string;
  status?: string;
  created_at?: string;
  manufacturer?: string;
  model?: string;
  equipment_type?: string;
  overall_status?: string;
  tolerance_pass?: string;
  requirements_pass?: boolean;
  cmc_pass?: boolean;
  [key: string]: unknown;
}

class PhoenixApiService {
  private baseURL: string;
  private username: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.baseURL = process.env.PHOENIX_LOGIN_API_URL?.replace('/api/auth/login', '') || 'http://portal.phoenixcalibrationdr.com';
    this.username = process.env.PHOENIX_USERNAME || '';
    this.password = process.env.PHOENIX_PASSWORD || '';
  }

  async authenticate(): Promise<string> {
    try {
      const response = await axios.post(process.env.PHOENIX_LOGIN_API_URL || `${this.baseURL}/api/auth/login`, {
        UserName: this.username,
        Password: this.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let token: string;
      
      if (typeof response.data === 'string') {
        token = response.data;
      } else if (response.data && typeof response.data === 'object') {
        if (response.data.AccessToken && response.data.AccessToken.Token) {
          token = response.data.AccessToken.Token;
        } else {
          token = response.data.token || response.data.accessToken || response.data.access_token || response.data.Token || response.data.AccessToken;
        }
      } else {
        throw new Error('Invalid token response structure');
      }
      
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token response');
      }

      this.token = token;
      this.tokenExpiry = Date.now() + (55 * 60 * 1000); // 55 minutes

      return this.token!;
    } catch (error) {
      console.error('Phoenix authentication error:', error);
      throw error;
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.token || Date.now() >= (this.tokenExpiry || 0)) {
      await this.authenticate();
    }

    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get all certificates with complete data
  async getAllCertificates(): Promise<PhoenixCertificate[]> {
    try {
      const headers = await this.getAuthHeaders();
      
      const requestBody = {
        EquipmentType: "",
        ProcedureCode: "",
        IsAccredited: ""
      };
      
      const response = await axios.post(
        process.env.LIST_ALL_CERTIFICATES_API_URL || '',
        requestBody,
        { headers }
      );

      return response.data || [];
    } catch (error) {
      console.error('Error fetching all certificates:', error);
      throw error;
    }
  }

  // Get pending approvals (lightweight - only cert numbers and dates)
  async getPendingApprovals(): Promise<PhoenixPendingCertificate[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(
        process.env.PHOENIX_LIST_API_URL || '',
        { headers }
      );

      return response.data?.Value?.Calibrations || [];
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  }

  // Get certificate details by cert number
  async getCertificateDetails(certNo: string): Promise<PhoenixCertificate> {
    try {
      const headers = await this.getAuthHeaders();
      const url = (process.env.PHOENIX_DETAIL_API_URL_TEMPLATE || '').replace('{certNo}', certNo);
      const response = await axios.get(url, { headers });

      return response.data?.Value?.Certificate || response.data;
    } catch (error) {
      console.error(`Error fetching certificate details for ${certNo}:`, error);
      throw error;
    }
  }

  // Compare Phoenix certificates with Supabase data
  compareCertificates(phoenixCerts: PhoenixCertificate[], supabaseCerts: SupabaseCertificate[]) {
    const phoenixCertNos = new Set(phoenixCerts.map(cert => cert.CertNo));
    const supabaseCertNos = new Set(supabaseCerts.map(cert => cert.cert_no));

    const matched = phoenixCerts.filter(cert => supabaseCertNos.has(cert.CertNo));
    const current = phoenixCerts.filter(cert => !supabaseCertNos.has(cert.CertNo));
    const historical = supabaseCerts.filter(cert => !phoenixCertNos.has(cert.cert_no));

    return {
      total: {
        phoenix: phoenixCerts.length,
        supabase: supabaseCerts.length,
        current: current.length,
        historical: historical.length,
        matched: matched.length
      },
      current,
      historical,
      matched
    };
  }

  // Calculate processing coverage metrics
  calculateProcessingCoverage(phoenixCerts: PhoenixCertificate[], supabaseCerts: SupabaseCertificate[]) {
    const comparison = this.compareCertificates(phoenixCerts, supabaseCerts);
    
    return {
      totalPhoenix: comparison.total.phoenix,
      totalSupabase: comparison.total.supabase,
      matching: comparison.total.matched,
      pendingProcessing: comparison.total.current,
      processingRate: comparison.total.phoenix > 0 ? 
        (comparison.total.matched / comparison.total.phoenix) * 100 : 0
    };
  }
}

export const phoenixApiService = new PhoenixApiService(); 