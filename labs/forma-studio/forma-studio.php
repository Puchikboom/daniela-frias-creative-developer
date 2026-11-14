<?php
/**
 * Plugin Name: Forma Studio — Inquiry Lab
 * Description: An original portfolio engineering example: secure-ish inquiry workflow, admin-only REST listing and accessible form.
 * Version: 0.1.0
 * Requires PHP: 8.0
 * License: GPL-2.0-or-later
 * Text Domain: forma-studio
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

final class Forma_Studio_Inquiry_Lab {
    private const POST_TYPE = 'forma_inquiry';
    private const ACTION = 'forma_submit_inquiry';

    public static function boot(): void {
        add_action('init', [self::class, 'register_type']);
        add_shortcode('forma_inquiry_form', [self::class, 'form_shortcode']);
        add_action('admin_post_nopriv_' . self::ACTION, [self::class, 'submit']);
        add_action('admin_post_' . self::ACTION, [self::class, 'submit']);
        add_action('rest_api_init', [self::class, 'register_routes']);
        add_action('wp_enqueue_scripts', [self::class, 'enqueue_styles']);
    }

    public static function register_type(): void {
        register_post_type(self::POST_TYPE, [
            'labels' => [
                'name' => __('Inquiries', 'forma-studio'),
                'singular_name' => __('Inquiry', 'forma-studio')
            ],
            'public' => false,
            'publicly_queryable' => false,
            'exclude_from_search' => true,
            'show_ui' => true,
            'show_in_menu' => true,
            'show_in_rest' => false,
            'capability_type' => 'post',
            'capabilities' => ['create_posts' => 'do_not_allow'],
            'map_meta_cap' => true,
            'supports' => ['title'],
            'menu_icon' => 'dashicons-email',
        ]);
    }

    public static function enqueue_styles(): void {
        if (!is_singular()) {
            return;
        }
        $page = get_post();
        if ($page instanceof WP_Post && has_shortcode($page->post_content, 'forma_inquiry_form')) {
            wp_enqueue_style(
                'forma-studio',
                plugin_dir_url(__FILE__) . 'assets/form.css',
                [],
                '0.1.0'
            );
        }
    }

    public static function form_shortcode(): string {
        $status = isset($_GET['forma_status']) ? sanitize_key(wp_unslash($_GET['forma_status'])) : '';
        $message = '';
        if ($status === 'sent') {
            $message = '<p class="forma-feedback" role="status">' .
                esc_html__('Your message was received. Thank you!', 'forma-studio') . '</p>';
        } elseif ($status === 'invalid') {
            $message = '<p class="forma-feedback forma-error" role="alert">' .
                esc_html__('Please check the fields and try again.', 'forma-studio') . '</p>';
        } elseif ($status === 'error') {
            $message = '<p class="forma-feedback forma-error" role="alert">' .
                esc_html__('The message could not be saved. Please try again.', 'forma-studio') . '</p>';
        }

        ob_start();
        ?>
        <section class="forma-wrapper" aria-labelledby="forma-heading">
            <p class="forma-eyebrow"><?php echo esc_html__('CONTACT / 01', 'forma-studio'); ?></p>
            <h2 id="forma-heading"><?php echo esc_html__('Start a conversation.', 'forma-studio'); ?></h2>
            <?php echo $message; // Only plugin-authored, escaped HTML. ?>
            <form class="forma-form" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post">
                <input type="hidden" name="action" value="<?php echo esc_attr(self::ACTION); ?>">
                <?php wp_nonce_field('forma_inquiry', 'forma_nonce'); ?>
                <div class="forma-honeypot" aria-hidden="true">
                    <label for="forma_website">Leave this field empty</label>
                    <input id="forma_website" type="text" name="website" tabindex="-1" autocomplete="off">
                </div>
                <label for="forma_name"><?php echo esc_html__('Your name', 'forma-studio'); ?></label>
                <input id="forma_name" name="name" type="text" minlength="2" maxlength="100" required autocomplete="name">
                <label for="forma_email"><?php echo esc_html__('Email address', 'forma-studio'); ?></label>
                <input id="forma_email" name="email" type="email" maxlength="190" required autocomplete="email">
                <label for="forma_message"><?php echo esc_html__('Tell us about your project', 'forma-studio'); ?></label>
                <textarea id="forma_message" name="message" minlength="10" maxlength="2000" rows="6" required></textarea>
                <button type="submit"><?php echo esc_html__('Send inquiry', 'forma-studio'); ?></button>
            </form>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    public static function submit(): void {
        if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? '')) !== 'POST') {
            wp_die(esc_html__('Method not allowed', 'forma-studio'), '', ['response' => 405]);
        }

        $nonce = isset($_POST['forma_nonce']) ? sanitize_text_field(wp_unslash($_POST['forma_nonce'])) : '';
        if (!wp_verify_nonce($nonce, 'forma_inquiry')) {
            wp_die(esc_html__('Invalid form token', 'forma-studio'), '', ['response' => 403]);
        }

        // Bot trap: do not persist suspected spam.
        if (!empty($_POST['website'])) {
            self::redirect('sent');
        }

        $name = isset($_POST['name']) && is_string($_POST['name'])
            ? sanitize_text_field(wp_unslash($_POST['name'])) : '';
        $email = isset($_POST['email']) && is_string($_POST['email'])
            ? sanitize_email(wp_unslash($_POST['email'])) : '';
        $message = isset($_POST['message']) && is_string($_POST['message'])
            ? sanitize_textarea_field(wp_unslash($_POST['message'])) : '';

        if (
            mb_strlen($name) < 2 || mb_strlen($name) > 100 ||
            !is_email($email) || strlen($email) > 190 ||
            mb_strlen($message) < 10 || mb_strlen($message) > 2000
        ) {
            self::redirect('invalid');
        }

        // Demo rate limiting by IP hash; production should use a durable rate limit/WAF.
        $ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
        $rate_key = 'forma_rate_' . hash_hmac('sha256', $ip, wp_salt('auth'));
        if (get_transient($rate_key)) {
            self::redirect('error');
        }

        $id = wp_insert_post([
            'post_type' => self::POST_TYPE,
            'post_status' => 'private',
            'post_title' => wp_strip_all_tags($name . ' — ' . gmdate('Y-m-d H:i')),
            'post_content' => '',
        ], true);

        if (is_wp_error($id)) {
            self::redirect('error');
        }

        update_post_meta($id, '_forma_name', $name);
        update_post_meta($id, '_forma_email', $email);
        update_post_meta($id, '_forma_message', $message);
        set_transient($rate_key, 1, MINUTE_IN_SECONDS);
        self::redirect('sent');
    }

    private static function redirect(string $status): never {
        $source = wp_get_referer();
        $url = $source ?: home_url('/');
        $url = remove_query_arg('forma_status', $url);
        wp_safe_redirect(add_query_arg('forma_status', $status, $url) . '#forma-heading', 303);
        exit;
    }

    public static function register_routes(): void {
        register_rest_route('forma/v1', '/inquiries', [
            'methods' => WP_REST_Server::READABLE,
            'permission_callback' => static fn(): bool => current_user_can('manage_options'),
            'callback' => static function (WP_REST_Request $request): WP_REST_Response {
                $page = max(1, (int) $request->get_param('page'));
                $query = new WP_Query([
                    'post_type' => self::POST_TYPE,
                    'post_status' => 'private',
                    'posts_per_page' => 10,
                    'paged' => $page,
                    'orderby' => 'date',
                    'order' => 'DESC',
                ]);
                $data = array_map(static function (WP_Post $post): array {
                    return [
                        'id' => $post->ID,
                        'name' => (string) get_post_meta($post->ID, '_forma_name', true),
                        'email' => (string) get_post_meta($post->ID, '_forma_email', true),
                        'message' => (string) get_post_meta($post->ID, '_forma_message', true),
                        'date' => get_the_date(DATE_ATOM, $post),
                    ];
                }, $query->posts);
                return new WP_REST_Response([
                    'data' => $data,
                    'page' => $page,
                    'total' => (int) $query->found_posts,
                    'pages' => (int) $query->max_num_pages,
                ], 200);
            },
            'args' => [
                'page' => [
                    'default' => 1,
                    'sanitize_callback' => 'absint',
                    'validate_callback' => static fn($v): bool => is_numeric($v) && (int) $v > 0,
                ],
            ],
        ]);
    }
}

Forma_Studio_Inquiry_Lab::boot();
