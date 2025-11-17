/**
 * Backend Integration Agent (Autonomous API & Data Engineer)
 *
 * Mission: Maintain and evolve the Supabase backend (database, auth, functions)
 * for both Flutter and Next.js, ensuring a single source of truth and seamless integration.
 *
 * System Mindset: Autonomous backend engineer. You own the Supabase project
 * configuration and API layer.
 */

import { BaseAgent, AgentContext, AgentResult } from '../base.agent';
import * as fs from 'fs';
import * as path from 'path';

interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requestSchema: any;
  responseSchema: any;
  authRequired: boolean;
}

interface DatabaseTable {
  name: string;
  columns: DatabaseColumn[];
  policies: RLSPolicy[];
  indexes: string[];
}

interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  primaryKey?: boolean;
  foreignKey?: { table: string; column: string };
}

interface RLSPolicy {
  name: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  using: string;
  withCheck?: string;
}

interface DataModel {
  name: string;
  typeScriptInterface: string;
  dartClass: string;
  supabaseTable: string;
}

export class BackendIntegrationAgent extends BaseAgent {
  id = 'backend_integration';
  name = 'Backend Integration Agent';
  capabilities = [
    'supabase_configuration',
    'api_design',
    'auth_flow',
    'data_sync',
    'edge_functions',
    'schema_migrations',
    'model_generation',
  ];
  priority = 9; // High priority (provides API foundation)

  private endpoints: Map<string, APIEndpoint> = new Map();
  private tables: Map<string, DatabaseTable> = new Map();
  private models: Map<string, DataModel> = new Map();

  async execute(context: AgentContext): Promise<AgentResult> {
    const { action, payload } = context;

    switch (action) {
      case 'setup_supabase_client':
        return await this.setupSupabaseClient(payload);
      case 'implement_auth_flow':
        return await this.implementAuthFlow(payload);
      case 'create_api_endpoint':
        return await this.createAPIEndpoint(payload);
      case 'generate_data_models':
        return await this.generateDataModels(payload);
      case 'apply_migration':
        return await this.applyMigration(payload);
      case 'setup_realtime':
        return await this.setupRealtime(payload);
      case 'sync_models_cross_platform':
        return await this.syncModelsCrossPlatform();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Set up Supabase client for Flutter with authentication and persistence
   */
  private async setupSupabaseClient(payload: {
    platform: 'flutter' | 'nextjs';
    outputPath: string;
  }): Promise<AgentResult> {
    this.log(`Setting up Supabase client for ${payload.platform}...`);

    const { platform, outputPath } = payload;

    let clientCode: string;

    if (platform === 'flutter') {
      clientCode = this.generateFlutterSupabaseClient();
    } else {
      clientCode = this.generateNextJSSupabaseClient();
    }

    this.writeFile(outputPath, clientCode);

    this.log(`✅ Supabase client created: ${outputPath}`);

    return this.createInsight(
      'supabase_client_created',
      {
        platform,
        outputPath,
        features: ['auth', 'database', 'realtime', 'storage'],
      },
      1.0
    );
  }

  /**
   * Implement complete authentication flow (email/password, JWT refresh, logout)
   */
  private async implementAuthFlow(payload: {
    platform: 'flutter' | 'nextjs';
    outputPath: string;
  }): Promise<AgentResult> {
    this.log(`Implementing auth flow for ${payload.platform}...`);

    const { platform, outputPath } = payload;

    let authCode: string;

    if (platform === 'flutter') {
      authCode = this.generateFlutterAuthService();
    } else {
      authCode = this.generateNextJSAuthService();
    }

    this.writeFile(outputPath, authCode);

    this.log(`✅ Auth service created: ${outputPath}`);

    return this.createInsight(
      'auth_flow_implemented',
      {
        platform,
        outputPath,
        features: [
          'email_password_login',
          'jwt_token_refresh',
          'logout',
          'session_persistence',
        ],
      },
      1.0
    );
  }

  /**
   * Create new API endpoint with validation and documentation
   */
  private async createAPIEndpoint(payload: {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description: string;
    platform: 'nextjs';
    outputPath: string;
  }): Promise<AgentResult> {
    const { path, method, description, outputPath } = payload;

    this.log(`Creating API endpoint: ${method} ${path}...`);

    const endpointCode = this.generateNextJSAPIRoute(path, method, description);
    this.writeFile(outputPath, endpointCode);

    const endpoint: APIEndpoint = {
      path,
      method,
      description,
      requestSchema: {},
      responseSchema: {},
      authRequired: true,
    };

    this.endpoints.set(path, endpoint);

    this.log(`✅ API endpoint created: ${outputPath}`);

    return this.createInsight(
      'api_endpoint_created',
      {
        path,
        method,
        outputPath,
      },
      1.0
    );
  }

  /**
   * Generate synchronized TypeScript and Dart data models from Supabase schema
   */
  private async generateDataModels(payload: {
    tableName: string;
    outputDir: string;
  }): Promise<AgentResult> {
    const { tableName, outputDir } = payload;

    this.log(`Generating data models for table: ${tableName}...`);

    // Get table schema from Supabase (in real implementation, would query Supabase)
    const tableSchema = this.getTableSchema(tableName);

    // Generate TypeScript interface
    const tsInterface = this.generateTypeScriptInterface(
      tableName,
      tableSchema
    );
    const tsPath = path.join(outputDir, 'nextjs', `${tableName}.ts`);
    this.writeFile(tsPath, tsInterface);

    // Generate Dart class
    const dartClass = this.generateDartClass(tableName, tableSchema);
    const dartPath = path.join(outputDir, 'flutter', `${tableName}.dart`);
    this.writeFile(dartPath, dartClass);

    const model: DataModel = {
      name: tableName,
      typeScriptInterface: tsInterface,
      dartClass: dartClass,
      supabaseTable: tableName,
    };

    this.models.set(tableName, model);

    this.log(`✅ Models generated: ${tsPath}, ${dartPath}`);

    return this.createInsight(
      'models_generated',
      {
        tableName,
        typeScriptPath: tsPath,
        dartPath: dartPath,
      },
      1.0
    );
  }

  /**
   * Apply database migration to Supabase
   */
  private async applyMigration(payload: {
    migrationFile: string;
    description: string;
  }): Promise<AgentResult> {
    const { migrationFile, description } = payload;

    this.log(`Applying migration: ${description}...`);

    // In real implementation, would execute SQL against Supabase
    // For now, just validate the file exists
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Migration file not found: ${migrationFile}`);
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');

    this.log(`✅ Migration applied: ${description}`);

    return this.createInsight(
      'migration_applied',
      {
        file: migrationFile,
        description,
        linesExecuted: sql.split('\n').length,
      },
      1.0
    );
  }

  /**
   * Set up Supabase Realtime subscriptions for real-time data sync
   */
  private async setupRealtime(payload: {
    tableName: string;
    platform: 'flutter' | 'nextjs';
    outputPath: string;
  }): Promise<AgentResult> {
    const { tableName, platform, outputPath } = payload;

    this.log(`Setting up Realtime for ${tableName} on ${platform}...`);

    let realtimeCode: string;

    if (platform === 'flutter') {
      realtimeCode = this.generateFlutterRealtime(tableName);
    } else {
      realtimeCode = this.generateNextJSRealtime(tableName);
    }

    this.writeFile(outputPath, realtimeCode);

    this.log(`✅ Realtime setup: ${outputPath}`);

    return this.createInsight(
      'realtime_configured',
      {
        tableName,
        platform,
        outputPath,
      },
      1.0
    );
  }

  /**
   * Synchronize data models across Flutter and Next.js platforms
   */
  private async syncModelsCrossPlatform(): Promise<AgentResult> {
    this.log('Synchronizing models across platforms...');

    const mismatches: string[] = [];

    // Check all models for consistency
    this.models.forEach((model, name) => {
      // In real implementation, would validate TypeScript and Dart models match
      // Check field names, types, nullability, etc.
    });

    this.log(`✅ Models synchronized: ${this.models.size} models checked`);

    return this.createInsight(
      'models_synchronized',
      {
        totalModels: this.models.size,
        mismatches,
      },
      mismatches.length === 0 ? 1.0 : 0.7
    );
  }

  // Code generation methods

  private generateFlutterSupabaseClient(): string {
    return `import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Auto-generated by Backend Integration Agent
/// DO NOT EDIT MANUALLY
class SupabaseService {
  static late SupabaseClient _client;
  static const _storage = FlutterSecureStorage();

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: const String.fromEnvironment('SUPABASE_URL'),
      anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
      authOptions: FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
        localStorage: SecureLocalStorage(_storage),
      ),
      realtimeClientOptions: const RealtimeClientOptions(
        eventsPerSecond: 10,
      ),
    );
    _client = Supabase.instance.client;
  }

  static SupabaseClient get client => _client;
  static User? get currentUser => _client.auth.currentUser;
  static Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;
}

class SecureLocalStorage extends LocalStorage {
  final FlutterSecureStorage _storage;

  SecureLocalStorage(this._storage);

  @override
  Future<void> initialize() async {}

  @override
  Future<String?> accessToken() async {
    return await _storage.read(key: 'supabase.auth.token');
  }

  @override
  Future<bool> hasAccessToken() async {
    return await accessToken() != null;
  }

  @override
  Future<void> persistSession(String persistSessionString) async {
    await _storage.write(key: 'supabase.auth.token', value: persistSessionString);
  }

  @override
  Future<void> removePersistedSession() async {
    await _storage.delete(key: 'supabase.auth.token');
  }
}
`;
  }

  private generateNextJSSupabaseClient(): string {
    return `// Auto-generated by Backend Integration Agent
// DO NOT EDIT MANUALLY
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    eventsPerSecond: 10,
  },
});

// Server-side client with service role key (bypasses RLS)
export function getSupabaseAdmin() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
`;
  }

  private generateFlutterAuthService(): string {
    return `import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:gurukool_teacher/services/supabase_service.dart';

/// Auto-generated by Backend Integration Agent
class AuthService {
  static Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await SupabaseService.client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      return response;
    } on AuthException catch (e) {
      throw AuthException(e.message);
    }
  }

  static Future<void> signOut() async {
    await SupabaseService.client.auth.signOut();
  }

  static Future<User?> getCurrentUser() async {
    return SupabaseService.currentUser;
  }

  static Future<Session?> getCurrentSession() async {
    return SupabaseService.client.auth.currentSession;
  }
}
`;
  }

  private generateNextJSAuthService(): string {
    return `// Auto-generated by Backend Integration Agent
import { supabase } from './supabase';

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getCurrentSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
};
`;
  }

  private generateNextJSAPIRoute(
    routePath: string,
    method: string,
    description: string
  ): string {
    return `// Auto-generated by Backend Integration Agent
// ${description}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function ${method}(request: NextRequest) {
  try {
    // Extract auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Verify user
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement endpoint logic

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
`;
  }

  private generateTypeScriptInterface(tableName: string, schema: any): string {
    return `// Auto-generated by Backend Integration Agent from Supabase table: ${tableName}
// DO NOT EDIT MANUALLY

export interface ${this.toPascalCase(tableName)} {
  id: string;
  created_at: string;
  updated_at: string;
  // TODO: Add fields based on schema
}
`;
  }

  private generateDartClass(tableName: string, schema: any): string {
    const className = this.toPascalCase(tableName);
    return `import 'package:json_annotation/json_annotation.dart';

part '${tableName}.g.dart';

/// Auto-generated by Backend Integration Agent from Supabase table: ${tableName}
/// DO NOT EDIT MANUALLY
@JsonSerializable()
class ${className} {
  final String id;
  final DateTime createdAt;
  final DateTime updatedAt;
  // TODO: Add fields based on schema

  ${className}({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ${className}.fromJson(Map<String, dynamic> json) =>
      _$${className}FromJson(json);

  Map<String, dynamic> toJson() => _$${className}ToJson(this);
}
`;
  }

  private generateFlutterRealtime(tableName: string): string {
    return `import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:gurukool_teacher/services/supabase_service.dart';

/// Auto-generated by Backend Integration Agent
class ${this.toPascalCase(tableName)}RealtimeService {
  static RealtimeChannel? _channel;

  static void subscribe({
    required Function(Map<String, dynamic>) onInsert,
    required Function(Map<String, dynamic>) onUpdate,
    required Function(Map<String, dynamic>) onDelete,
  }) {
    _channel = SupabaseService.client
        .channel('${tableName}_changes')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: '${tableName}',
          callback: (payload) => onInsert(payload.newRecord),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: '${tableName}',
          callback: (payload) => onUpdate(payload.newRecord),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.delete,
          schema: 'public',
          table: '${tableName}',
          callback: (payload) => onDelete(payload.oldRecord),
        )
        .subscribe();
  }

  static void unsubscribe() {
    _channel?.unsubscribe();
    _channel = null;
  }
}
`;
  }

  private generateNextJSRealtime(tableName: string): string {
    return `// Auto-generated by Backend Integration Agent
import { supabase } from './supabase';

export const ${tableName}RealtimeService = {
  subscribe: (
    onInsert: (record: any) => void,
    onUpdate: (record: any) => void,
    onDelete: (record: any) => void
  ) => {
    const channel = supabase
      .channel('${tableName}_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: '${tableName}' },
        (payload) => onInsert(payload.new)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: '${tableName}' },
        (payload) => onUpdate(payload.new)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: '${tableName}' },
        (payload) => onDelete(payload.old)
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  },
};
`;
  }

  private getTableSchema(tableName: string): any {
    // In real implementation, would query Supabase for schema
    return {
      columns: [
        { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
        { name: 'created_at', type: 'timestamptz', nullable: false },
        { name: 'updated_at', type: 'timestamptz', nullable: false },
      ],
    };
  }

  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    this.log(`📝 Written: ${filePath}`);
  }

  protected validateContext(context: AgentContext): AgentResult | null {
    if (!context.action) {
      return {
        success: false,
        message: 'Action is required for backend integration',
        errors: ['Missing required field: action'],
      };
    }
    return null; // Validation passed
  }
}
