
import { IPFilterRule } from '../types/torrent';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class IPFilter {
  private rules: IPFilterRule[];
  private enabledTorrents: Set<string>;
  private filtersEnabled: boolean;
  private blockedRanges: Array<[number, number]>; // Start and end IP as numbers

  constructor() {
    this.rules = [];
    this.enabledTorrents = new Set();
    this.filtersEnabled = false;
    this.blockedRanges = [];
    
    this.loadRulesFromFile();
  }

  private loadRulesFromFile() {
    try {
      const filePath = path.join(__dirname, '../../data/ipfilter.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const loadedRules = JSON.parse(data) as IPFilterRule[];
        this.setRules(loadedRules);
      } else {
        console.log('No IP filter file found. Creating default empty filter.');
        // Ensure directory exists
        const dirPath = path.join(__dirname, '../../data');
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        // Create empty filter file
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('Error loading IP filter rules:', error);
    }
  }

  private saveRulesToFile() {
    try {
      const filePath = path.join(__dirname, '../../data/ipfilter.json');
      fs.writeFileSync(filePath, JSON.stringify(this.rules, null, 2));
    } catch (error) {
      console.error('Error saving IP filter rules:', error);
    }
  }

  getRules(): IPFilterRule[] {
    return [...this.rules];
  }

  setRules(rules: IPFilterRule[]): void {
    this.rules = [...rules];
    this.updateBlockedRanges();
    this.saveRulesToFile();
  }

  addRule(rule: Omit<IPFilterRule, 'id'>): IPFilterRule {
    const id = Date.now().toString();
    const newRule = { ...rule, id };
    this.rules.push(newRule);
    this.updateBlockedRanges();
    this.saveRulesToFile();
    return newRule;
  }

  updateRule(id: string, rule: Partial<IPFilterRule>): boolean {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.rules[index] = { ...this.rules[index], ...rule };
    this.updateBlockedRanges();
    this.saveRulesToFile();
    return true;
  }

  deleteRule(id: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(r => r.id !== id);
    
    if (this.rules.length !== initialLength) {
      this.updateBlockedRanges();
      this.saveRulesToFile();
      return true;
    }
    
    return false;
  }

  enableFilters(): void {
    this.filtersEnabled = true;
  }

  disableFilters(): void {
    this.filtersEnabled = false;
  }

  isEnabled(): boolean {
    return this.filtersEnabled;
  }

  enableForTorrent(torrentId: string): void {
    this.enabledTorrents.add(torrentId);
  }

  disableForTorrent(torrentId: string): void {
    this.enabledTorrents.delete(torrentId);
  }

  isEnabledForTorrent(torrentId: string): boolean {
    return this.filtersEnabled && this.enabledTorrents.has(torrentId);
  }

  isBlocked(ip: string): boolean {
    if (!this.filtersEnabled || this.blockedRanges.length === 0) return false;
    
    const ipNum = this.ipToLong(ip);
    if (isNaN(ipNum)) return false;
    
    return this.blockedRanges.some(([start, end]) => ipNum >= start && ipNum <= end);
  }

  private updateBlockedRanges() {
    this.blockedRanges = [];
    
    for (const rule of this.rules) {
      if (!rule.blocked) continue;
      
      if (rule.range.includes('-')) {
        // Range format: 192.168.1.1-192.168.1.255
        const [startIP, endIP] = rule.range.split('-');
        const start = this.ipToLong(startIP.trim());
        const end = this.ipToLong(endIP.trim());
        
        if (!isNaN(start) && !isNaN(end)) {
          this.blockedRanges.push([start, end]);
        }
      } else if (rule.range.includes('/')) {
        // CIDR format: 192.168.1.0/24
        const [baseIP, bits] = rule.range.split('/');
        const cidrBits = parseInt(bits.trim(), 10);
        const baseIpLong = this.ipToLong(baseIP.trim());
        
        if (!isNaN(baseIpLong) && !isNaN(cidrBits)) {
          const mask = ~((1 << (32 - cidrBits)) - 1);
          const start = baseIpLong & mask;
          const end = start + (1 << (32 - cidrBits)) - 1;
          this.blockedRanges.push([start, end]);
        }
      } else {
        // Single IP: 192.168.1.1
        const ip = this.ipToLong(rule.range.trim());
        if (!isNaN(ip)) {
          this.blockedRanges.push([ip, ip]);
        }
      }
    }
  }

  private ipToLong(ip: string): number {
    const parts = ip.split('.');
    if (parts.length !== 4) return NaN;
    
    return ((parseInt(parts[0], 10) << 24) |
           (parseInt(parts[1], 10) << 16) |
           (parseInt(parts[2], 10) << 8) |
           parseInt(parts[3], 10)) >>> 0;
  }
}

export const ipFilter = new IPFilter();
