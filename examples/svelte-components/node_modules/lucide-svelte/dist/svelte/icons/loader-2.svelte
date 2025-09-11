<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M21 12a9 9 0 1 1-6.219-8.56" }]];
</script>

<Icon name="loader-2" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
