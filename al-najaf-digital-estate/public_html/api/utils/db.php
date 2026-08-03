<?php
/**
 * ============================================================
 * Database Connection Utility
 * ============================================================
 * Singleton PDO connection with prepared statements only.
 * ============================================================
 */

declare(strict_types=1);

final class Database
{
    private static ?PDO $instance = null;

    private function __construct()
    {
        // Prevent direct instantiation
    }

    private function __clone()
    {
        // Prevent cloning
    }

    /**
     * Get the singleton PDO instance.
     */
    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                DB_HOST,
                DB_PORT,
                DB_NAME,
                DB_CHARSET
            );

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, DB_OPTIONS);
            } catch (PDOException $e) {
                if (APP_DEBUG) {
                    Response::error('Database connection failed: ' . $e->getMessage(), 500);
                }
                Response::error('Service temporarily unavailable', 500);
            }
        }

        return self::$instance;
    }

    /**
     * Execute a query with parameters and return the PDOStatement.
     * Uses prepared statements exclusively.
     *
     * @param string $sql    SQL query with named or positional placeholders
     * @param array  $params Parameters to bind
     */
    public static function query(string $sql, array $params = []): PDOStatement
    {
        $pdo = self::getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * Fetch a single row.
     *
     * @return array<string,mixed>|null
     */
    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $stmt = self::query($sql, $params);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /**
     * Fetch all rows.
     *
     * @return array<int,array<string,mixed>>
     */
    public static function fetchAll(string $sql, array $params = []): array
    {
        $stmt = self::query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Fetch a single scalar value (first column of first row).
     *
     * @return mixed|null
     */
    public static function fetchScalar(string $sql, array $params = []): mixed
    {
        $stmt = self::query($sql, $params);
        $val = $stmt->fetchColumn();
        return $val === false ? null : $val;
    }

    /**
     * Insert a row and return the last insert ID.
     *
     * @return string Last insert ID
     */
    public static function insert(string $sql, array $params = []): string
    {
        $pdo = self::getConnection();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $pdo->lastInsertId();
    }

    /**
     * Execute an UPDATE or DELETE and return affected row count.
     */
    public static function execute(string $sql, array $params = []): int
    {
        $stmt = self::query($sql, $params);
        return $stmt->rowCount();
    }

    /**
     * Begin a transaction.
     */
    public static function beginTransaction(): void
    {
        self::getConnection()->beginTransaction();
    }

    /**
     * Commit a transaction.
     */
    public static function commit(): void
    {
        self::getConnection()->commit();
    }

    /**
     * Rollback a transaction.
     */
    public static function rollback(): void
    {
        $pdo = self::getConnection();
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }

    /**
     * Check if a table exists.
     */
    public static function tableExists(string $table): bool
    {
        $result = self::fetchScalar(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
            [DB_NAME, $table]
        );
        return (int) $result > 0;
    }
}
