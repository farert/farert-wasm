<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m3 11 18-5v12L3 14v-3z" }], ["path", { "d": "M11.6 16.8a3 3 0 1 1-5.8-1.6" }]];
</script>

<Icon name="megaphone" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
