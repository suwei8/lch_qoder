import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LoggerService } from '../../common/services/logger.service';
import { BusinessExceptions } from '../../common/exceptions/business.exception';

export interface WechatUserInfo {
  openid: string;
  unionid?: string;
  nickname?: string;
  headimgurl?: string;
  session_key?: string;
}

export interface WechatAccessTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
}

@Injectable()
export class WechatService {
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.appId = this.configService.get<string>('WECHAT_APP_ID');
    this.appSecret = this.configService.get<string>('WECHAT_APP_SECRET');
    
    if (!this.appId || !this.appSecret) {
      throw new Error('微信配置缺失：WECHAT_APP_ID 或 WECHAT_APP_SECRET 未设置');
    }
  }

  /**
   * 通过授权码获取用户OpenID
   */
  async getOpenidByCode(code: string): Promise<WechatUserInfo> {
    try {
      const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
      const params = {
        appid: this.appId,
        secret: this.appSecret,
        code: code,
        grant_type: 'authorization_code',
      };

      this.logger.business(
        '请求微信OAuth接口',
        'WechatService',
        { code, appId: this.appId }
      );

      const response = await axios.get<WechatAccessTokenResponse>(url, { params });
      
      if (response.data.openid) {
        this.logger.business(
          '微信OAuth成功',
          'WechatService',
          { openid: response.data.openid }
        );

        return {
          openid: response.data.openid,
          unionid: response.data.unionid,
        };
      } else {
        // 微信返回错误
        this.logger.errorWithContext(
          new Error('微信OAuth失败'),
          'WechatService',
          response.data
        );
        
        throw BusinessExceptions.unauthorized('微信授权失败');
      }
    } catch (error) {
      this.logger.errorWithContext(
        error,
        'WechatService',
        { code }
      );

      if (error instanceof BusinessExceptions) {
        throw error;
      }

      throw BusinessExceptions.unauthorized('微信授权请求失败');
    }
  }

  /**
   * 获取微信用户详细信息
   */
  async getUserInfo(accessToken: string, openid: string): Promise<WechatUserInfo> {
    try {
      const url = 'https://api.weixin.qq.com/sns/userinfo';
      const params = {
        access_token: accessToken,
        openid: openid,
        lang: 'zh_CN',
      };

      const response = await axios.get(url, { params });
      
      if (response.data.openid) {
        return {
          openid: response.data.openid,
          unionid: response.data.unionid,
          nickname: response.data.nickname,
          headimgurl: response.data.headimgurl,
        };
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (error) {
      this.logger.errorWithContext(
        error,
        'WechatService',
        { accessToken: accessToken.substring(0, 10) + '...', openid }
      );
      
      throw BusinessExceptions.unauthorized('获取微信用户信息失败');
    }
  }

  /**
   * 生成微信授权URL
   */
  generateAuthUrl(redirectUri: string, state?: string): string {
    const baseUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    const params = new URLSearchParams({
      appid: this.appId,
      redirect_uri: encodeURIComponent(redirectUri),
      response_type: 'code',
      scope: 'snsapi_userinfo',
      state: state || 'STATE',
    });

    return `${baseUrl}?${params.toString()}#wechat_redirect`;
  }

  /**
   * 验证微信签名
   */
  verifySignature(signature: string, timestamp: string, nonce: string, token: string): boolean {
    const crypto = require('crypto');
    const arr = [token, timestamp, nonce].sort();
    const str = arr.join('');
    const sha1 = crypto.createHash('sha1').update(str).digest('hex');
    return sha1 === signature;
  }

  /**
   * 发送微信模板消息
   */
  async sendTemplateMessage(params: {
    touser: string;
    template_id: string;
    url?: string;
    miniprogram?: {
      appid: string;
      pagepath: string;
    };
    data: Record<string, { value: string; color?: string }>;
  }): Promise<boolean> {
    try {
      // 获取访问令牌
      const accessToken = await this.getAccessToken();
      
      const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
      
      const response = await axios.post(url, params);
      
      if (response.data.errcode === 0) {
        this.logger.business(
          '微信模板消息发送成功',
          'WechatService',
          { 
            touser: params.touser, 
            template_id: params.template_id,
            msgid: response.data.msgid 
          }
        );
        return true;
      } else {
        this.logger.errorWithContext(
          new Error(`微信模板消息发送失败: ${response.data.errmsg}`),
          'WechatService',
          response.data
        );
        return false;
      }
    } catch (error) {
      this.logger.errorWithContext(
        error,
        'WechatService',
        { touser: params.touser, template_id: params.template_id }
      );
      return false;
    }
  }

  /**
   * 获取微信公众号访问令牌
   */
  private async getAccessToken(): Promise<string> {
    try {
      const url = 'https://api.weixin.qq.com/cgi-bin/token';
      const params = {
        grant_type: 'client_credential',
        appid: this.appId,
        secret: this.appSecret,
      };

      const response = await axios.get(url, { params });
      
      if (response.data.access_token) {
        return response.data.access_token;
      } else {
        throw new Error(`获取访问令牌失败: ${response.data.errmsg}`);
      }
    } catch (error) {
      this.logger.errorWithContext(error, 'WechatService');
      throw new Error('获取微信访问令牌失败');
    }
  }
}