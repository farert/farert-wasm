<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "M15 7h2a5 5 0 0 1 0 10h-2m-6 0H7A5 5 0 0 1 7 7h2" }]];
</script>

<Icon name="unlink-2" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
